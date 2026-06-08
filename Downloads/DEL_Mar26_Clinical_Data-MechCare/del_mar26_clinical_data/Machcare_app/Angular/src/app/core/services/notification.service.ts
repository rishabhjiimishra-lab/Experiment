import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  forkJoin,
  interval,
  of,
} from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.config';

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  machineLabel: string;
  read: boolean;
  severity?: string;
  category?: string;
  timeAgo?: string;
}

const READ_STORAGE_KEY = 'machcare-notifications-read';
const TIMESTAMP_STORAGE_KEY = 'machcare-notifications-timestamps';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollSub: Subscription | null = null;
  private timeAgoSub: Subscription | null = null;

  constructor(private http: HttpClient) {
    this.startPolling();
    this.startTimeAgoRefresh();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.timeAgoSub?.unsubscribe();
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.fetchNotifications();
  }

  markAsRead(id: string): void {
    const readIds = this.getReadIds();

    if (!readIds.has(id)) {
      readIds.add(id);
      this.persistReadIds(readIds);
    }

    this.applyReadState();
  }

  markAllRead(): void {
    const readIds = this.getReadIds();

    this.notificationsSubject.value.forEach((item) => readIds.add(item.id));

    this.persistReadIds(readIds);
    this.applyReadState();
  }

  private startPolling(): void {
    if (this.pollSub) {
      return;
    }

    this.pollSub = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchNotifications()),
      )
      .subscribe();
  }

  private startTimeAgoRefresh(): void {
    if (this.timeAgoSub) {
      return;
    }

    this.timeAgoSub = interval(1000).subscribe(() => {
      const sorted = this.sortLatestFirst(this.notificationsSubject.value);
      const updated = this.withTimeAgo(sorted);
      this.notificationsSubject.next(updated);
    });
  }

  private fetchNotifications(): Observable<NotificationItem[]> {
    const token = localStorage.getItem('token');
    const roleId = Number(localStorage.getItem('roleId'));

    if (!token || ![1, 2, 3].includes(roleId)) {
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
      return of([]);
    }

    const source$: Observable<any> =
      roleId === 1
        ? forkJoin({
            faults: this.http
              .get<any>(`${API_BASE_URL}/faultlogs`)
              .pipe(catchError(() => of([]))),
            machines: this.http
              .get<any>(`${API_BASE_URL}/admin/machines`)
              .pipe(catchError(() => of([]))),
            alerts: this.http
              .get<any>(`${API_BASE_URL}/engineer/alerts`)
              .pipe(catchError(() => of([]))),
          })
        : roleId === 2
          ? forkJoin({
              pending: this.http
                .get<any>(`${API_BASE_URL}/engineer/faults/pending`)
                .pipe(catchError(() => of([]))),
              alerts: this.http
                .get<any>(`${API_BASE_URL}/engineer/alerts`)
                .pipe(catchError(() => of([]))),
              analyses: this.http
                .get<any>(`${API_BASE_URL}/fault-analysis`)
                .pipe(catchError(() => of([]))),
            })
          : forkJoin({
              faults: this.http
                .get<any>(`${API_BASE_URL}/faultlogs`)
                .pipe(catchError(() => of([]))),
              machines: this.http
                .get<any>(`${API_BASE_URL}/machines`)
                .pipe(catchError(() => of([]))),
            });

    return source$.pipe(
      map<any, NotificationItem[]>((response: any) =>
        this.buildRoleNotifications(response, roleId),
      ),
      map<NotificationItem[], NotificationItem[]>((items: NotificationItem[]) => {
        const stableItems = this.preserveExistingTimestamps(items);
        const sortedItems = this.sortLatestFirst(stableItems);
        const updatedItems = this.withTimeAgo(sortedItems);

        this.notificationsSubject.next(updatedItems);
        this.unreadCountSubject.next(
          updatedItems.filter((item: NotificationItem) => !item.read).length,
        );

        return updatedItems;
      }),
      catchError(() => {
        const currentItems = this.withTimeAgo(
          this.sortLatestFirst(this.notificationsSubject.value),
        );

        this.unreadCountSubject.next(
          currentItems.filter((item) => !item.read).length,
        );

        return of(currentItems);
      }),
    );
  }

  private buildRoleNotifications(response: any, roleId: number): NotificationItem[] {
    let notifications: NotificationItem[] = [];

    if (roleId === 1) {
      notifications = [
        ...this.buildFaultNotifications(this.unwrap(response.faults), 'admin-fault'),
        ...this.buildMachineNotifications(this.unwrap(response.machines)),
        ...this.buildAlertNotifications(this.unwrap(response.alerts)),
      ];
    } else if (roleId === 2) {
      notifications = [
        ...this.buildPendingAnalysisNotifications(this.unwrap(response.pending)),
        ...this.buildAlertNotifications(this.unwrap(response.alerts)),
        ...this.buildAnalysisNotifications(this.unwrap(response.analyses)),
      ];
    } else {
      notifications = [
        ...this.buildFaultNotifications(this.unwrap(response.faults), 'operator-fault'),
        ...this.buildMachineStatusNotifications(this.unwrap(response.machines)),
      ];
    }

    return this.sortLatestFirst(notifications).slice(0, 12);
  }

  private sortLatestFirst(items: NotificationItem[]): NotificationItem[] {
    return [...items].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  private preserveExistingTimestamps(items: NotificationItem[]): NotificationItem[] {
    const oldItems = this.notificationsSubject.value;
    const savedTimestamps = this.getSavedTimestamps();

    const updatedItems = items.map((item) => {
      const oldItem = oldItems.find((old) => old.id === item.id);

      if (oldItem?.timestamp) {
        savedTimestamps[item.id] = oldItem.timestamp;

        return {
          ...item,
          timestamp: oldItem.timestamp,
          read: item.read,
        };
      }

      if (savedTimestamps[item.id]) {
        return {
          ...item,
          timestamp: savedTimestamps[item.id],
          read: item.read,
        };
      }

      savedTimestamps[item.id] = item.timestamp;

      return item;
    });

    this.persistSavedTimestamps(savedTimestamps);

    return updatedItems;
  }

  private buildFaultNotifications(
    faults: any[],
    idPrefix = 'fault',
  ): NotificationItem[] {
    const readIds = this.getReadIds();

    const sorted = [...faults].sort((a, b) => {
      const dateA = this.parseFaultTimestamp(a);
      const dateB = this.parseFaultTimestamp(b);
      return dateB.getTime() - dateA.getTime();
    });

    return sorted.slice(0, 10).map((fault, index) => {
      const id = `${idPrefix}-${fault.faultId || fault.machineId || index}`;
      const machineLabel = fault.machineName || fault.machineId || 'Machine';
      const timestamp = this.parseFaultTimestamp(fault).toISOString();
      const severity = fault.severity || 'Info';
      const message = this.getRoleAwareMessage(machineLabel, severity, fault);

      return {
        id,
        message,
        timestamp,
        machineLabel,
        severity,
        category: this.getNotificationCategory(severity),
        read: readIds.has(id),
      };
    });
  }

  private buildMachineNotifications(machines: any[]): NotificationItem[] {
    const readIds = this.getReadIds();

    return machines.slice(0, 4).map((machine, index) => {
      const id = `machine-${machine.machineId || index}`;

      return {
        id,
        message: `Machine ${machine.machineName || machine.machineId} registered with ${machine.productionCriticality || 'Medium'} criticality`,
        timestamp: this.parseMachineTimestamp(machine).toISOString(),
        machineLabel: machine.machineName || machine.machineId || 'Machine',
        category: 'Machine event',
        read: readIds.has(id),
      };
    });
  }

  private buildMachineStatusNotifications(machines: any[]): NotificationItem[] {
    const readIds = this.getReadIds();

    return machines.slice(0, 4).map((machine, index) => {
      const id = `operator-machine-${machine.machineId || index}`;

      return {
        id,
        message: `${machine.machineName || machine.machineId} status is ${machine.status || 'available'}`,
        timestamp: this.parseMachineTimestamp(machine).toISOString(),
        machineLabel: machine.machineName || machine.machineId || 'Machine',
        category: 'Machine status',
        read: readIds.has(id),
      };
    });
  }

  private buildPendingAnalysisNotifications(faults: any[]): NotificationItem[] {
    const readIds = this.getReadIds();

    return faults.slice(0, 8).map((fault, index) => {
      const id = `pending-${fault.faultId || index}`;

      return {
        id,
        message: `${fault.priorityLevel || 'P3'} analysis pending for ${fault.machineId || 'machine'}`,
        timestamp: this.parseFaultTimestamp(fault).toISOString(),
        machineLabel: fault.machineId || 'Machine',
        severity: fault.severity,
        category: 'Pending analysis',
        read: readIds.has(id),
      };
    });
  }

  private buildAnalysisNotifications(analyses: any[]): NotificationItem[] {
    const readIds = this.getReadIds();

    return analyses.slice(0, 4).map((analysis, index) => {
      const id = `analysis-${analysis.analysisId || index}`;

      return {
        id,
        message: `Analysis completed for fault ${analysis.faultId}`,
        timestamp: this.parseAnalysisTimestamp(analysis).toISOString(),
        machineLabel: analysis.faultId || 'Fault',
        category: 'Analysis completion',
        read: readIds.has(id),
      };
    });
  }

  private buildAlertNotifications(alerts: any[]): NotificationItem[] {
    const readIds = this.getReadIds();

    return alerts.slice(0, 6).map((alert, index) => {
      const id = `alert-${alert.alertId || alert.linkedAnalysisId || index}`;

      return {
        id,
        message: `${alert.alertPriority || 'Alert'} generated for ${alert.machineId || 'machine'}`,
        timestamp: this.parseAlertTimestamp(alert).toISOString(),
        machineLabel: alert.machineId || 'Machine',
        severity: alert.alertPriority?.includes('Critical') ? 'Critical' : 'High',
        category: 'Critical alert',
        read: readIds.has(id),
      };
    });
  }

  private withTimeAgo(items: NotificationItem[]): NotificationItem[] {
    return items.map((item) => ({
      ...item,
      timeAgo: this.getTimeAgo(item.timestamp),
    }));
  }

  getTimeAgo(timestamp: string): string {
    const time = new Date(timestamp).getTime();
    const now = Date.now();

    if (Number.isNaN(time)) {
      return 'just now';
    }

    const diffSeconds = Math.max(1, Math.floor((now - time) / 1000));

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  private unwrap(response: any): any[] {
    const data = response?.data || response || [];
    return Array.isArray(data) ? data : [];
  }

  private getRoleAwareMessage(
    machineLabel: string,
    severity: string,
    fault: any,
  ): string {
    const roleId = Number(localStorage.getItem('roleId'));
    const normalizedSeverity = (severity || '').toLowerCase();
    const faultType = fault.faultType || fault.description || 'fault';

    if (normalizedSeverity === 'critical') {
      return `Critical machine alert on ${machineLabel}`;
    }

    if (roleId === 1) {
      return `${severity} fault logged on ${machineLabel}`;
    }

    if (roleId === 2) {
      return `Maintenance review needed for ${machineLabel}`;
    }

    if (roleId === 3) {
      return `Latest ${faultType} update for ${machineLabel}`;
    }

    return `New fault reported on ${machineLabel}`;
  }

  private getNotificationCategory(severity: string): string {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'Critical alert';
      case 'high':
        return 'High priority';
      case 'medium':
        return 'Maintenance notice';
      default:
        return 'System update';
    }
  }

  private parseFaultTimestamp(fault: any): Date {
    const directTimestamp =
      fault?.createdAtUtc ||
      fault?.createdAt ||
      fault?.reportedAtUtc ||
      fault?.reportedAt ||
      fault?.timestamp;

    if (directTimestamp) {
      return this.parseBackendTimestamp(directTimestamp);
    }

    if (fault?.faultDate && fault?.faultTime) {
      return this.parseBackendTimestamp(`${fault.faultDate}T${fault.faultTime}`);
    }

    if (fault?.faultDate) {
      return this.parseBackendTimestamp(`${fault.faultDate}T00:00:00`);
    }

    return new Date();
  }

  private parseAlertTimestamp(alert: any): Date {
    const directTimestamp =
      alert?.createdAtUtc ||
      alert?.createdAt ||
      alert?.alertCreatedAtUtc ||
      alert?.alertCreatedAt ||
      alert?.generatedAtUtc ||
      alert?.generatedAt ||
      alert?.timestamp;

    if (directTimestamp) {
      return this.parseBackendTimestamp(directTimestamp);
    }

    if (alert?.alertDate && alert?.alertTime) {
      return this.parseBackendTimestamp(`${alert.alertDate}T${alert.alertTime}`);
    }

    return new Date();
  }

  private parseAnalysisTimestamp(analysis: any): Date {
    const directTimestamp =
      analysis?.createdAtUtc ||
      analysis?.createdAt ||
      analysis?.analysisCreatedAtUtc ||
      analysis?.analysisCreatedAt ||
      analysis?.completedAtUtc ||
      analysis?.completedAt ||
      analysis?.timestamp;

    if (directTimestamp) {
      return this.parseBackendTimestamp(directTimestamp);
    }

    if (analysis?.analysisDate && analysis?.analysisTime) {
      return this.parseBackendTimestamp(
        `${analysis.analysisDate}T${analysis.analysisTime}`,
      );
    }

    return new Date();
  }

  private parseMachineTimestamp(machine: any): Date {
    const directTimestamp =
      machine?.createdAtUtc ||
      machine?.createdAt ||
      machine?.registeredAtUtc ||
      machine?.registeredAt ||
      machine?.updatedAtUtc ||
      machine?.updatedAt ||
      machine?.timestamp;

    if (directTimestamp) {
      return this.parseBackendTimestamp(directTimestamp);
    }

    return new Date();
  }

  private parseBackendTimestamp(value: string | Date): Date {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date() : value;
    }

    if (!value) {
      return new Date();
    }

    const text = String(value).trim();

    const hasTimezone =
      text.endsWith('Z') ||
      /[+-]\d{2}:\d{2}$/.test(text);

    const normalized = hasTimezone ? text : `${text}Z`;
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private getSavedTimestamps(): Record<string, string> {
    const stored = localStorage.getItem(TIMESTAMP_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    try {
      return JSON.parse(stored) || {};
    } catch {
      return {};
    }
  }

  private persistSavedTimestamps(timestamps: Record<string, string>): void {
    localStorage.setItem(TIMESTAMP_STORAGE_KEY, JSON.stringify(timestamps));
  }

  private getReadIds(): Set<string> {
    const stored = localStorage.getItem(READ_STORAGE_KEY);

    if (!stored) {
      return new Set();
    }

    try {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed || []);
    } catch {
      return new Set();
    }
  }

  private persistReadIds(readIds: Set<string>): void {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  }

  private applyReadState(): void {
    const readIds = this.getReadIds();

    const updated = this.withTimeAgo(
      this.sortLatestFirst(
        this.notificationsSubject.value.map((item) => ({
          ...item,
          read: readIds.has(item.id),
        })),
      ),
    );

    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(updated.filter((item) => !item.read).length);
  }
}