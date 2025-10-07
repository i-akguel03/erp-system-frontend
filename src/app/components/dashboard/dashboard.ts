import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  
  githubUrl = 'https://github.com/i-akguel03/erp-system-backend';
  swaggerUrl = 'https://erp-system-backend-yo8w.onrender.com/swagger-ui/index.html';

  technologies = [
    {
      title: 'Backend',
      description: 'Spring Boot 3.x mit Java 17',
      icon: 'bi bi-server fs-1',
      colorClass: 'primary'
    },
    {
      title: 'Sicherheit',
      description: 'Spring Security & JWT Authentication',
      icon: 'bi bi-shield-lock fs-1',
      colorClass: 'success'
    },
    {
      title: 'Datenbank',
      description: 'PostgreSQL & MSSQL Support',
      icon: 'bi bi-database fs-1',
      colorClass: 'info'
    },
    {
      title: 'Deployment',
      description: 'Docker & Cloud-Ready',
      icon: 'bi bi-cloud-arrow-up fs-1',
      colorClass: 'danger'
    }
  ];

  features = [
    {
      title: 'Kundenverwaltung',
      description: 'Vollständiges CRM-System für effizientes Kundenmanagement',
      icon: 'bi bi-people-fill',
      details: [
        'Kundenprofile & Kontakte',
        'Adressverwaltung',
        'Interaktionshistorie',
        'Segmentierung'
      ]
    },
    {
      title: 'Produktmanagement',
      description: 'Zentrale Verwaltung aller Produkte und Services',
      icon: 'bi bi-box-seam',
      details: [
        'Produktkatalog',
        'Preisgestaltung',
        'Kategorisierung',
        'Bestandsübersicht'
      ]
    },
    {
      title: 'Abonnements',
      description: 'Flexible Subscription-Management Lösung',
      icon: 'bi bi-calendar-check',
      details: [
        'Wiederkehrende Zahlungen',
        'Automatische Verlängerung',
        'Kündigungsverwaltung',
        'Custom Billing Cycles'
      ]
    },
    {
      title: 'Rechnungsstellung',
      description: 'Automatisierte Batch-Rechnungserstellung',
      icon: 'bi bi-receipt',
      details: [
        'Batch-Processing',
        'PDF-Generierung',
        'Email-Versand',
        'Zahlungsverfolgung'
      ]
    },
    {
      title: 'Fälligkeitsverwaltung',
      description: 'Intelligentes Due-Schedule System',
      icon: 'bi bi-clock-history',
      details: [
        'Automatische Terminierung',
        'Erinnerungen',
        'Mahnwesen',
        'Überfälligkeits-Tracking'
      ]
    },
    {
      title: 'REST API',
      description: 'Moderne RESTful API mit OpenAPI Dokumentation',
      icon: 'bi bi-code-square',
      details: [
        'Swagger/OpenAPI 3.0',
        'Versionierung',
        'CORS-Support',
        'Rate Limiting'
      ]
    }
  ];

  architectureHighlights = [
    {
      title: 'Clean Architecture',
      description: 'Klare Trennung von Domain, Service und Controller Layer mit DTOs für sichere Datenübertragung',
      icon: 'bi bi-diagram-3'
    },
    {
      title: 'Security First',
      description: 'JWT-basierte Authentifizierung, Role-Based Access Control und sichere Password-Verschlüsselung',
      icon: 'bi bi-shield-check'
    },
    {
      title: 'Exception Handling',
      description: 'Globales Exception Handling mit aussagekräftigen Error Responses und Logging',
      icon: 'bi bi-exclamation-triangle'
    },
    {
      title: 'Batch Processing',
      description: 'Effiziente Verarbeitung großer Datenmengen mit Transaction Management und Rollback-Strategie',
      icon: 'bi bi-lightning'
    },
    {
      title: 'Database Optimization',
      description: 'JPA/Hibernate mit Query Optimization, Lazy Loading und Connection Pooling',
      icon: 'bi bi-speedometer2'
    },
    {
      title: 'Testing',
      description: 'Umfassende Unit- und Integration-Tests mit JUnit 5 und MockMvc',
      icon: 'bi bi-check2-circle'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}