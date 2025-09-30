import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  register(email: string, password: string): Observable<{ message: string }> {
    // Simulate a successful registration response
    return of({ message: 'User registered successfully' });
  }
};
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [ReactiveFormsModule]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.register(
        this.registerForm.value.email as string,
        this.registerForm.value.password as string
      ).subscribe({
        next: (response: { message: string }) => {
          alert('Registration successful!');
          this.router.navigate(['/login']);
        },
        error: (error: { error: { error: string } }) => {
          alert('Registration failed: ' + error.error.error);
        }
      });
    }
  }
}