import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';

export interface UserProfile {
  email: string;
  roleId: number;
  empId: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this.profileSubject.asObservable();
  private profileLoaded = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
  ) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res?.success && res?.token) {
          const roleId = Number(res.roleId);
          localStorage.setItem('token', res.token);
          localStorage.setItem('roleId', String(roleId));
          localStorage.setItem('name', res?.name || 'MachCare User');
          this.profileLoaded = false;
          this.profileSubject.next(null);
        }
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRoleId(): number {
    const roleId = Number(localStorage.getItem('roleId'));
    return Number.isNaN(roleId) ? 0 : roleId;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getProfile(): Observable<UserProfile | null> {
    if (this.profileLoaded && this.profileSubject.value) {
      return of(this.profileSubject.value);
    }

    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap((profile) => {
        const normalizedProfile = profile
          ? { ...profile, roleId: Number(profile.roleId) }
          : profile;
        this.profileLoaded = true;
        this.profileSubject.next(normalizedProfile || null);
      }),
      map((profile) => (profile ? { ...profile, roleId: Number(profile.roleId) } : null)),
      catchError((error) => {
        if (error?.status === 401) {
          this.logout('Session expired', 'Please sign in again.');
        }
        return throwError(() => error);
      }),
    );
  }

  logout(
    title = 'Logged Out',
    message = 'You have been logged out successfully',
  ): void {
    localStorage.removeItem('token');
    localStorage.removeItem('roleId');
    localStorage.removeItem('name');

    this.profileLoaded = false;
    this.profileSubject.next(null);

    if (this.toastService) {
      this.toastService.success(title, message);
    }

    this.router.navigate(['/']);
  }
}