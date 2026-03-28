import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'roles',
    loadComponent: () => import('./components/role-management.component').then(m => m.RoleManagementComponent)
  }
];
