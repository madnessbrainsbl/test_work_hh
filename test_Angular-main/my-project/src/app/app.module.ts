import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
// Импортируйте остальные компоненты: RegisterComponent, UserDetailComponent, UserListComponent и т.д.

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    // ... ваши компоненты
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    CommonModule,
    // ... другие модули, например, AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }