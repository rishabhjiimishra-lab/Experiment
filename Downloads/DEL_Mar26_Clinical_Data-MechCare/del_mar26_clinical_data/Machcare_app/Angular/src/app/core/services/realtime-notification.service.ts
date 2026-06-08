import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RealtimeEvent<T = any> {
  type: string;
  timestamp?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeNotificationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private eventSubject = new Subject<RealtimeEvent>();

  readonly events$ = this.eventSubject.asObservable();

  constructor(private zone: NgZone) {}

  connect(): void {
    const token = localStorage.getItem('token');

    if (
      !token ||
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.manuallyClosed = false;

    const separator = environment.wsUrl.includes('?') ? '&' : '?';
    const url = `${environment.wsUrl}${separator}token=${encodeURIComponent(token)}`;

    this.socket = new WebSocket(url);

    this.socket.onmessage = (message) => {
      this.zone.run(() => {
        try {
          const parsed = JSON.parse(message.data);

          this.eventSubject.next({
            type: parsed.type,
            timestamp: parsed.timestamp || new Date().toISOString(),
            data: parsed.data,
          });
        } catch {
          console.warn('Ignored invalid realtime message', message.data);
        }
      });
    };

    this.socket.onclose = () => {
      this.socket = null;

      if (!this.manuallyClosed && localStorage.getItem('token')) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  onType<T = any>(type: string): Observable<RealtimeEvent<T>> {
    return this.events$.pipe(filter((event) => event.type === type));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}