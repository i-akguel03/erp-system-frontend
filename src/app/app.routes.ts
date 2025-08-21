import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'customer' // leitet '' zu 'customer' weiter
  },
  {
    path: 'customer',
    component: CustomerListComponent,
  },
  {
    path: '**',
    redirectTo: '' // unbekannte Pfade → Startseite
  }
];
