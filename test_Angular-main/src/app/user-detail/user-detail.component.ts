import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class UserDetailComponent implements OnInit {
  user: any;
  editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      job: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.apiService.getUser(Number(userId)).subscribe(
        (response: any) => {
          this.user = response.data;
          this.editForm.patchValue({
            name: this.user.first_name,
            job: ''
          });
        }
      );
    }
  }

  onSubmit(): void {
    if (this.editForm.valid && this.user) {
      this.apiService.updateUser(this.user.id, this.editForm.value).subscribe(
        () => {
          this.router.navigate(['/users']);
        }
      );
    }
  }
}