import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'https://reqres.in/api';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 2) {
    return this.http.get(`${this.baseUrl}/users?page=${page}`);
  }

  getResources() {
    return this.http.get(`${this.baseUrl}/unknown`);
  }

  getUser(id: number) {
    return this.http.get(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/users/${id}`, data);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }
}