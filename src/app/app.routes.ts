// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AuthGuard } from './auth/guards/auth-guard/auth-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { TestDashboardComponent } from './components/test-dashboard/test-dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // geschützte Routen
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'test', component: TestDashboardComponent, canActivate: [AuthGuard] },
  { path: 'customer', component: CustomerListComponent, canActivate: [AuthGuard] },

  // Weiterleitungen
  { path: '', pathMatch: 'full', redirectTo: 'customer' },
  { path: '**', redirectTo: '' }
];
