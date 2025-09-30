import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://reqres.in/api';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Произошла ошибка';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Ошибка: ${error.error.message}`;
    } else {
      errorMessage = `Код ошибки: ${error.status}, сообщение: ${error.error?.message || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => errorMessage);
  }

  getUsers(page: number = 2): Observable<any> {
    return this.http.get(`${this.baseUrl}/users?page=${page}`).pipe(
      catchError(this.handleError)
    );
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, data).pipe(
      tap(() => console.log('Пользователь успешно обновлен')),
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`).pipe(
      tap(() => console.log('Пользователь успешно удален')),
      catchError(this.handleError)
    );
  }

  getResources(): Observable<any> {
    return this.http.get(`${this.baseUrl}/unknown`).pipe(
      catchError(this.handleError)
    );
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap(() => console.log('Вход выполнен успешно')),
      catchError(this.handleError)
    );
  }

  register(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data).pipe(
      tap(() => console.log('Регистрация выполнена успешно')),
      catchError(this.handleError)
    );
  }
}