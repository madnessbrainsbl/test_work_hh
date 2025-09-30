import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  resources: any[] = [];

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.getUsers(2).subscribe((response: any) => {
      this.users = response.data;
    });
    this.apiService.getResources().subscribe((response: any) => {
      this.resources = response.data;
    });
  }

  viewUser(id: number): void {
    this.router.navigate(['/users', id]);
  }

  onDeleteUser(id: number): void {
    this.apiService.deleteUser(id).subscribe(() => {
      this.users = this.users.filter(user => user.id !== id);
    });
  }
}