import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: 'preferences',
    loadComponent: () => import('./components/preferences.component').then(m => m.PreferencesComponent)
  },
  {
    path: 'security',
    loadComponent: () => import('./components/security.component').then(m => m.SecurityComponent)
  }
];
