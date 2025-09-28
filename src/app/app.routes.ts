// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AuthGuard } from './auth/guards/auth-guard/auth-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { TestDashboardComponent } from './components/test-dashboard/test-dashboard';
import { ContractListComponent } from './components/contract-list/contract-list';
import { AddressListComponent } from './components/address-list/address-list';
import { ProductListComponent } from './components/product-list/product-list';
import { SubscriptionListComponent } from './components/subscription-list/subscription-list';
import { ContractCenterComponent } from './components/contract-center/contract-center';
import { DueScheduleListComponent } from './components/schedule-list/schedule-list';
import { InvoiceListComponent } from './components/invoice-list/invoice-list';
import { OpenItemList } from './components/open-item-list/open-item-list';
import { VorgaengeListComponent } from './components/vorgang-list/vorgang-list';
import { InvoiceBatchListComponent } from './components/invoice-batch-list/invoice-batch-list';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // geschützte Routen
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'test', component: TestDashboardComponent, canActivate: [AuthGuard] },
  { path: 'customer', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'contract', component: ContractListComponent, canActivate: [AuthGuard] },
  { path: 'address', component: AddressListComponent, canActivate: [AuthGuard] },
  { path: 'subscription', component: SubscriptionListComponent, canActivate: [AuthGuard] },
  { path: 'product', component: ProductListComponent, canActivate: [AuthGuard] },
  { path: 'contract-center', component: ContractCenterComponent, canActivate: [AuthGuard] },
  { path: 'due-schedule', component: DueScheduleListComponent, canActivate: [AuthGuard] },
  { path: 'invoice', component: InvoiceListComponent, canActivate: [AuthGuard] },
  { path: 'open-item', component: OpenItemList, canActivate: [AuthGuard] },
  { path: 'invoice-batch', component: InvoiceBatchListComponent, canActivate: [AuthGuard] },

  { path: 'vorgang', component: VorgaengeListComponent, canActivate: [AuthGuard] },


  // Weiterleitungen
  { path: '', pathMatch: 'full', redirectTo: 'customer' },
  { path: '**', redirectTo: '' }
];
