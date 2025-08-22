import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  items = [
    { label: 'Kunden', icon: 'bi-people', routerLink: '/customer' },
    { label: 'Produkte', icon: 'bi-box', routerLink: '/products' },
    { label: 'Aufträge', icon: 'bi-cart', routerLink: '/orders' },
    { label: 'Logout', icon: 'bi-box-arrow-right', command: () => this.logout() }
  ];
  
  isCollapsed = true;

  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    console.log('Logout ausgeführt');
    // Hier ggf. Token entfernen oder Redirect durchführen
  }
}
