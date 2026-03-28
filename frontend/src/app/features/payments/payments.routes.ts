import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/payment-schedule.component').then(m => m.PaymentScheduleComponent)
  }
];
