import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  warn(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['toast-warn'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
