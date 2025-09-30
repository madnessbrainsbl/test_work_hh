import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(
        this.loginForm.value.email as string,
        this.loginForm.value.password as string
      ).subscribe({
        next: (response: { token: string }) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/']);
        },
        error: (error: { error: { error: string } }) => {
          alert('Login failed: ' + error.error.error);
        }
      });
    }
  }
}