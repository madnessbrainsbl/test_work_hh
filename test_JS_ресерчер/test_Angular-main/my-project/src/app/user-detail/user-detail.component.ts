import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class UserDetailComponent implements OnInit {
  user: any;
  editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      name: [''],
      job: ['']
    });
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    this.apiService.getUser(Number(userId)).subscribe((response: any) => {
      this.user = response.data;
    });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.apiService.updateUser(this.user.id, this.editForm.value)
        .subscribe(() => {
          alert('User updated successfully!');
          this.router.navigate(['/']);
        });
    }
  }
}