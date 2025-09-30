import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  login(email: string, password: string): Observable<{ token: string }> {
    // Пример: возвращаем тестовый токен
    return of({ token: 'fake-jwt-token' });
  }
}