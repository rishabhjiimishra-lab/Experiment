import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = (route.data?.['roles'] as number[]) || [];
  const roleId = Number(authService.getRoleId());

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRoles.length === 0 || requiredRoles.includes(roleId)) {
    return true;
  }

  if (roleId === 1) {
    router.navigate(['/admin/dashboard']);
  } else if (roleId === 2) {
    router.navigate(['/engineer/dashboard']);
  } else if (roleId === 3) {
    router.navigate(['/operator/dashboard']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};