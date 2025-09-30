import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  imports: [CommonModule]
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  resources: any[] = [];

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.getUsers(2).pipe(
      catchError((error) => {
        console.error('Error fetching users:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      this.users = response.data;
    });

    this.apiService.getResources().pipe(
      catchError((error) => {
        console.error('Error fetching resources:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      this.resources = response.data;
    });
  }

  viewUser(id: number): void {
    this.router.navigate(['/users', id]);
  }

  onDeleteUser(id: number): void {
    this.apiService.deleteUser(id).pipe(
      catchError((error) => {
        console.error('Error deleting user:', error);
        return of(null);
      })
    ).subscribe(() => {
      this.users = this.users.filter(user => user.id !== id);
    });
  }
}