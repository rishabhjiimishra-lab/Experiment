import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AlertService } from '../../../core/services/alert-service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-maintenance-alert',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './maintenance-alert.component.html',
  styleUrls: ['./maintenance-alert.component.css']
})
export class MaintenanceAlertComponent implements OnInit, OnDestroy {

  alerts: any[] = [];
  filteredAlerts: any[] = [];
  loading = true;
  searchText = '';
  severityFilter = 'All';
  fromDate = '';
  toDate = '';

  private realtimeSubs: Subscription[] = [];

  constructor(
    private alertService: AlertService,
    private realtimeService: RealtimeNotificationService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.listenForRealtimeAlertUpdates();
  }

  ngOnDestroy(): void {
    this.realtimeSubs.forEach((sub) => sub.unsubscribe());
  }

  loadAlerts(): void {
    this.loading = true;

    this.alertService.getAllAlerts().subscribe({
      next: (response: any) => {
        let data = response.data || [];

        data = data.filter((alert: any) => !alert.empId && alert.status !== 'Assigned' && alert.status !== 'Resolved');

        this.alerts = this.sortAlerts(data);
        this.filterAlerts();
        this.loading = false;
      },
      error: (error) => {
        console.log(error);
        this.loading = false;
      }
    });
  }

  filterAlerts(): void {
    const search = this.searchText.toLowerCase();

    this.filteredAlerts = this.alerts.filter(alert => {
      const matchesSearch =
        alert.machineId?.toLowerCase().includes(search) ||
        alert.issueName?.toLowerCase().includes(search) ||
        alert.alertReason?.toLowerCase().includes(search);

      const matchesSeverity =
        this.severityFilter === 'All' || alert.severity === this.severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }

  autoAssign(alertId: number): void {
    this.alertService.autoAssign(alertId).subscribe({
      next: () => {
        this.removeAlertFromUi(alertId);
        this.toastService.success('Task assigned', 'Maintenance task assigned successfully.');
      },
      error: (error) => {
        console.log(error);
        this.toastService.error('Assignment failed', error?.error?.message || 'Unable to assign this alert.');
      }
    });
  }

  private listenForRealtimeAlertUpdates(): void {
    this.realtimeService.connect();

    this.realtimeSubs.push(
      this.realtimeService.onType<any>('MACHINE_ALERT_GENERATED').subscribe((event) => {
        const alert = event.data;
        if (!alert?.alertId || alert.empId) return;

        this.alerts = this.sortAlerts([
          alert,
          ...this.alerts.filter((item) => item.alertId !== alert.alertId),
        ]);
        this.filterAlerts();

        this.toastService.warning(
          'New critical alert',
          `${alert.machineId || 'Machine'} has a new alert ready for auto assignment.`,
        );
      }),

      this.realtimeService.onType<any>('ALERT_ASSIGNED').subscribe((event) => {
        const alertId = event.data?.alert?.alertId || event.data?.schedule?.alertId;
        if (alertId) {
          this.removeAlertFromUi(Number(alertId));
        }
      }),
    );
  }

  private removeAlertFromUi(alertId: number): void {
    this.alerts = this.alerts.filter(alert => Number(alert.alertId) !== Number(alertId));
    this.filterAlerts();
  }

  private sortAlerts(alerts: any[]): any[] {
    return [...alerts].sort((a: any, b: any) => this.priorityValue(a) - this.priorityValue(b));
  }

  private priorityValue(alert: any): number {
    const raw = alert?.priority?.value || alert?.priority || alert?.alertPriority || '3';
    if (`${raw}`.includes('1') || `${raw}`.toLowerCase().includes('critical')) return 1;
    if (`${raw}`.includes('2') || `${raw}`.toLowerCase().includes('high')) return 2;
    return 3;
  }
}
