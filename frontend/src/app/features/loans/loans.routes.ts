import { Routes } from '@angular/router';

export const loanRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/loan-list.component').then(m => m.LoanListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/create-loan.component').then(m => m.CreateLoanComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/loan-detail.component').then(m => m.LoanDetailComponent)
  }
];
