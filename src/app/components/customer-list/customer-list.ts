import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { Customer, CustomerService } from '../../services/services/customer';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';





@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    CardModule,
    ProgressSpinnerModule,
    ToggleButtonModule,
    FormsModule,
    TableModule
  ],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.scss'],
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;
  checked: boolean = false;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Kunden';
        console.error(err);
        this.loading = false;
      },
    });
  }
}
