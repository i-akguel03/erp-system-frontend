import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth';
import { DashboardService } from '../../services/dashboard.service';
import {
  DashboardKpiDto,
  MonthlyRevenueDto,
  OpenItemsOverviewDto,
  OutstandingPaymentsDto
} from '../../models/Dashboard';

@Component({
  selector: 'app-analyse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './analyse.html'
})
export class AnalyseComponent implements OnInit {

  currentUser: string | null = null;
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;

  kpi: DashboardKpiDto | null = null;
  revenue: MonthlyRevenueDto[] = [];
  openItems: OpenItemsOverviewDto | null = null;
  outstanding: OutstandingPaymentsDto | null = null;

  kpiLoading = false;
  revenueLoading = false;
  openItemsLoading = false;
  outstandingLoading = false;

  readonly chartHeight = 150;
  readonly barWidth = 36;
  readonly barGap = 10;
  readonly chartTopPad = 26;

  readonly quickLinks = [
    { label: 'Vertragscenter', path: '/contract-center', icon: 'bi bi-briefcase',        color: 'text-primary' },
    { label: 'Kunden',         path: '/customer',        icon: 'bi bi-people-fill',       color: 'text-info' },
    { label: 'Verträge',       path: '/contract',        icon: 'bi bi-file-earmark-text', color: 'text-secondary' },
    { label: 'Abonnements',    path: '/subscription',    icon: 'bi bi-arrow-repeat',      color: 'text-success' },
    { label: 'Rechnungslauf',  path: '/invoice-batch',   icon: 'bi bi-play-circle',       color: 'text-warning' },
    { label: 'Offene Posten',  path: '/open-item',       icon: 'bi bi-cash-stack',        color: 'text-danger' }
  ];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAll();
  }

  loadAll(): void {
    this.loadKpi();
    this.loadRevenue();
    this.loadOpenItems();
    this.loadOutstanding();
  }

  loadKpi(): void {
    this.kpiLoading = true;
    this.dashboardService.getKpi().subscribe({
      next: (data) => { this.kpi = data; this.kpiLoading = false; },
      error: () => { this.kpiLoading = false; }
    });
  }

  loadRevenue(): void {
    this.revenueLoading = true;
    this.dashboardService.getMonthlyRevenue(this.selectedYear).subscribe({
      next: (data) => { this.revenue = data; this.revenueLoading = false; },
      error: () => { this.revenueLoading = false; }
    });
  }

  loadOpenItems(): void {
    this.openItemsLoading = true;
    this.dashboardService.getOpenItemsOverview().subscribe({
      next: (data) => { this.openItems = data; this.openItemsLoading = false; },
      error: () => { this.openItemsLoading = false; }
    });
  }

  loadOutstanding(): void {
    this.outstandingLoading = true;
    this.dashboardService.getOutstandingPayments().subscribe({
      next: (data) => { this.outstanding = data; this.outstandingLoading = false; },
      error: () => { this.outstandingLoading = false; }
    });
  }

  onYearChange(): void {
    this.loadRevenue();
  }

  get years(): number[] {
    const y = this.currentYear;
    return [y - 2, y - 1, y];
  }

  get chartBars() {
    if (!this.revenue.length) return [];
    const max = Math.max(...this.revenue.map(r => Number(r.totalAmount) || 0), 1);
    return this.revenue.map((r, i) => {
      const amount = Number(r.totalAmount) || 0;
      const h = Math.max((amount / max) * this.chartHeight, 2);
      const barY = this.chartTopPad + this.chartHeight - h;
      return {
        x: i * (this.barWidth + this.barGap) + this.barGap,
        y: barY,
        height: h,
        labelY: this.chartTopPad + this.chartHeight + 14,
        amountY: barY - 5,
        label: r.monthLabel ? r.monthLabel.split(' ')[0] : `M${r.month}`,
        amount,
        amountStr: amount >= 1000
          ? (amount / 1000).toFixed(1).replace('.', ',') + 'k'
          : amount.toFixed(0),
        count: r.invoiceCount
      };
    });
  }

  get svgWidth(): number {
    return this.revenue.length * (this.barWidth + this.barGap) + this.barGap;
  }

  get svgHeight(): number {
    return this.chartTopPad + this.chartHeight + 30;
  }

  agingPercent(value: number): number {
    if (!this.openItems?.totalOutstandingAmount) return 0;
    return Math.min((value / Number(this.openItems.totalOutstandingAmount)) * 100, 100);
  }

  get revenueTotal(): number {
    return this.revenue.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  }

  get revenueMax(): number {
    if (!this.revenue.length) return 0;
    return this.revenue.reduce((max, r) => Math.max(max, Number(r.totalAmount) || 0), 0);
  }
}
