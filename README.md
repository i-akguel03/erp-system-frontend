# ERP System – Frontend

<p align="center">
  <img src="https://img.shields.io/badge/Angular-20-dd0031?style=for-the-badge&logo=angular&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Bootstrap-5-7952b3?style=for-the-badge&logo=bootstrap&logoColor=white"/>
  <img src="https://img.shields.io/badge/PrimeNG-19-4f46e5?style=for-the-badge&logo=primeng&logoColor=white"/>
  <img src="https://img.shields.io/badge/PWA-ready-5a0fc8?style=for-the-badge&logo=pwa&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
</p>

<p align="center">
  <a href="https://erp-system-frontend-tan.vercel.app/"><strong>🌐 Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://erp-system-backend-yo8w.onrender.com/swagger-ui/index.html"><strong>📚 API Docs</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/i-akguel03/erp-system-backend"><strong>⚙️ Backend Repository</strong></a>
</p>

---

Produktionsnahes **Enterprise Resource Planning Frontend** – entwickelt mit Angular 20 (Standalone Components), TypeScript 5.8 und Bootstrap 5.  
Vollständige SPA für alle ERP-Domänen: von der Kundenverwaltung über automatisierte Rechnungsstellung bis hin zu Live-Analytics und Admin-Tools.

> **Demo Login:** `admin` / `admin`

---

## Screenshots

### Portfolio-Dashboard (öffentlich)
Recruiter-optimiertes Dashboard mit Live-KPIs, Tech Stack und Feature-Übersicht – ohne Login zugänglich.

### Abrechnungscenter
Überfällige Posten, Aging-Analyse, Mahnwesen und Zahlungserfassung in einer strukturierten Übersicht.

### Vertragscenter
Ganzheitliche Vertragsverwaltung mit Subscription-Lifecycle und Statusverfolgung.

---

## Features

### Authentifizierung
- JWT-basiertes Login/Register mit automatischem Token-Handling
- `AuthGuard` und `AdminGuard` für Routen-Schutz
- Automatische Weiterleitung nach Login/Logout
- Auth-Status-Observable für reaktive UI-Updates

### Portfolio-Dashboard (öffentlich zugänglich)
- **Ohne Login:** Demo-KPIs mit realistischen Beispieldaten und goldenem „Demo"-Badge
- **Mit Login:** Echte Live-Daten direkt aus dem Backend
- Recruiter-optimierte Darstellung: Tech Stack Pills, Feature-Domänen-Karten, Architektur-Patterns
- Hero-Section mit Gradient-Design, Animationen und direkten Links zu GitHub & Swagger

### Kundenverwaltung (CRM)
- CRUD mit sortierbarer, paginierbarer Listansicht
- Adress-Autovervollständigung beim Verknüpfen
- Suche und Filter in Echtzeit
- Floating Labels in allen Formularen

### Produkt- & Adressverwaltung
- Produktkatalog mit Preisen, Einheiten, Typen und Lagerbestand
- Adressverwaltung mit Freitext- und Auswahlsuche
- Doppelklick-Schutz (`saving`-Flag) auf allen Speichern-Buttons

### Vertrags- & Abonnementmanagement
- Vollständige Vertragsverwaltung mit Laufzeiten
- Subscription-Lifecycle-Anzeige mit Statusindikatoren
- **Vertragscenter:** Übersichts-Dashboard für alle Vertrags-KPIs

### Fakturierung & Rechnungslauf
- Fälligkeitspläne mit konfigurierbaren Intervallen
- Transaktionaler Rechnungslauf mit Fortschrittsanzeige
- Rechnungsliste mit Detail-Ansicht und Positionsverwaltung
- Offene-Posten-Liste mit Echtzeit-Status

### Abrechnungscenter (Billing Hub)
- **Aging-Analyse** mit farbcodierten Balken (1–30, 31–60, 61–90, >90 Tage)
- Tab-Navigation: Überfällig / Offen / Teilbezahlt / Alle aktiven Posten
- Zahlungserfassung direkt im Modal (Betrag, Zahlungsart, Referenz)
- Mahnwesen: E-Mail-Erinnerung per Klick mit Zähler
- Stornierung mit Bestätigungsdialog
- Desktop-Tabelle + Mobile-Card-Layout
- **Vertragsnummer-Anreicherung** via Client-seitigem Join über drei Ebenen

### Vorgänge & Offene Posten
- Vorgangs-Liste mit Typ- und Status-Filterung
- Offene-Posten-Verwaltung mit Teilzahlungsunterstützung

### Analyse & KPI
- Live-Kennzahlen: MRR, Umsatz, Kundenwachstum
- Diagramme und Verlaufsansichten

### Benachrichtigungssystem
- Echtzeit-Polling mit 60-Sekunden-Intervall
- Ungelesen-Badge in der Navbar
- Markierung als gelesen, Listenansicht aller Benachrichtigungen

### Administration
- **Benutzerverwaltung** – Rollen und Accounts verwalten (`AdminGuard`)
- **Audit-Log** – alle Datenänderungen mit Vorher-/Nachher-Vergleich
- **Datenverwaltung (Init)** – passwortgeschützte Testdaten-Initialisierung

---

## Tech Stack

| Kategorie | Technologie | Version |
|---|---|---|
| Framework | Angular (Standalone Components) | 20.3.1 |
| Sprache | TypeScript | 5.8 |
| UI-Framework | Bootstrap | 5 |
| Komponentenbibliothek | PrimeNG | 19 |
| Icons | Bootstrap Icons | 1.11 |
| HTTP | Angular HttpClient | – |
| Routing | Angular Router + Guards | – |
| Reaktivität | RxJS | 7.x |
| PWA | Angular Service Worker | – |
| Build | Angular CLI / Vite | 20.x |
| Deployment | Vercel | – |

---

## Architektur

### Komponentenstruktur
```
src/app/
├── auth/
│   ├── login/              # Login-Komponente
│   ├── register/           # Registrierung
│   ├── guards/             # AuthGuard, AdminGuard
│   └── services/           # AuthService + JWT-Handling
├── components/
│   ├── dashboard/          # Portfolio-Dashboard (public)
│   ├── billing-center/     # Abrechnungscenter
│   ├── contract-center/    # Vertragscenter
│   ├── analyse/            # Analytics & KPIs
│   ├── customer-list/      # CRM
│   ├── address-list/       # Adressen
│   ├── product-list/       # Produkte
│   ├── contract-list/      # Verträge
│   ├── subscription-list/  # Abonnements
│   ├── invoice-list/       # Rechnungen
│   ├── invoice-batch-list/ # Rechnungslauf
│   ├── open-item-list/     # Offene Posten
│   ├── due-schedule/       # Fälligkeitspläne
│   ├── vorgang-list/       # Vorgänge
│   ├── notification-list/  # Benachrichtigungen
│   ├── admin/              # Benutzerverwaltung
│   ├── audit-log/          # Audit-Log
│   ├── init/               # Datenverwaltung
│   └── navbar/             # Navigation + Polling
├── services/               # API-Services
└── models/                 # TypeScript-Interfaces
```

### Design-Patterns
- **Standalone Components** – kein NgModule-Overhead, modular und lazy-loadbar
- **`@if` / `@for`** – neue Angular 17+ Control Flow Syntax (kein `*ngIf`/`*ngFor`)
- **`saving`-Flag** – Doppelklick-Schutz auf allen Formularen
- **`BaseApiService`** – zentralisierter API-Base-URL-Handling
- **Floating Labels** – Bootstrap `form-floating` in allen Modals
- **`forkJoin`** – paralleles Laden mehrerer API-Ressourcen (z. B. Abrechnungscenter)
- **Reactive Polling** – `interval()` + `switchMap()` + `takeUntil()` für Benachrichtigungs-Badge

---

## Routen-Übersicht

| Route | Zugang | Beschreibung |
|---|---|---|
| `/dashboard` | Öffentlich | Portfolio-Dashboard mit Live-KPIs |
| `/login` | Öffentlich | JWT-Login |
| `/register` | Öffentlich | Registrierung |
| `/customer` | AuthGuard | Kundenverwaltung |
| `/address` | AuthGuard | Adressverwaltung |
| `/product` | AuthGuard | Produktkatalog |
| `/contract` | AuthGuard | Verträge |
| `/subscription` | AuthGuard | Abonnements |
| `/contract-center` | AuthGuard | Vertragscenter |
| `/billing-center` | AuthGuard | Abrechnungscenter |
| `/due-schedule` | AuthGuard | Fälligkeitspläne |
| `/invoice-batch` | AuthGuard | Rechnungslauf |
| `/invoice` | AuthGuard | Rechnungen |
| `/open-item` | AuthGuard | Offene Posten |
| `/vorgang` | AuthGuard | Vorgänge |
| `/analyse` | AuthGuard | Analytics |
| `/notifications` | AuthGuard | Benachrichtigungen |
| `/admin` | AdminGuard | Benutzerverwaltung |
| `/audit-logs` | AdminGuard | Audit-Log |
| `/init` | AdminGuard | Datenverwaltung |

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- Angular CLI 20

```bash
npm install -g @angular/cli
```

### Start

```bash
git clone https://github.com/i-akguel03/erp-system-frontend.git
cd erp-system-frontend
npm install
ng serve
```

App läuft auf: **http://localhost:4200**

### Backend verbinden

Das Frontend kommuniziert mit dem Backend über einen konfigurierbaren API-Basis-URL.  
Für lokale Entwicklung muss das [Backend](https://github.com/i-akguel03/erp-system-backend) auf Port 8080 laufen.

### Build

```bash
ng build --configuration production
```

Build-Artefakte liegen in `dist/erp-system-frontend/`.

---

## Deployment

Das Frontend wird automatisch auf **Vercel** deployed bei jedem Push auf `main`:

- Vercel erkennt Angular automatisch und konfiguriert den Build
- SPA-Routing ist über `vercel.json` konfiguriert
- Live-URL: https://erp-system-frontend-tan.vercel.app/

---

## PWA

Die App ist als Progressive Web App konfiguriert:

- `ngsw-config.json` mit Cache-Strategien
- Installierbar auf Desktop und Mobile
- Custom Icons in 8 Größen (72–512px) unter `public/icons/`

---

## Lizenz

Dieses Projekt ist nicht frei verwendbar.  
Nutzung ausschließlich zu Lern- und Demonstrationszwecken gestattet.  
Keine kommerzielle Verwendung ohne ausdrückliche Genehmigung des Autors.

---

<p align="center">
  Entwickelt von <strong>i-akguel03</strong> ·
  <a href="https://erp-system-frontend-tan.vercel.app/">Live Demo öffnen</a>
</p>
