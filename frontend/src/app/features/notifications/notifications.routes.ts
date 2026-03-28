import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/notification-list.component').then(m => m.NotificationListComponent)
  }
];
