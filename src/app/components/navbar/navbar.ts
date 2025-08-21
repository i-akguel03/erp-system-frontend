import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MenubarModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  items = [
    {
      label: 'Kunden',
      icon: 'pi pi-users',
      routerLink: '/customer'
    },
    {
      label: 'Produkte',
      icon: 'pi pi-box',
      routerLink: '/products'
    },
    {
      label: 'Aufträge',
      icon: 'pi pi-shopping-cart',
      routerLink: '/orders'
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  logout() {
    // Hier ggf. Token entfernen oder Redirect durchführen
    console.log('Logout ausgeführt');
  }
}
