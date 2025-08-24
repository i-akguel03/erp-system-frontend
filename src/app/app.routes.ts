// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth/guards/auth-guard/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // geschützte Routen
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'customer', component: CustomerListComponent, canActivate: [AuthGuard] },

  // Weiterleitungen
  { path: '', pathMatch: 'full', redirectTo: 'customer' },
  { path: '**', redirectTo: '' }
];
