import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { Role } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatChipsModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss'
})
export class RoleManagementComponent implements OnInit {
  roles$!: Observable<Role[]>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.roles$ = this.userService.getRoles().pipe(map(r => r.items));
  }
}
