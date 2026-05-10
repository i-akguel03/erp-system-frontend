import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAdminService, UserAdminDto } from '../../services/user-admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  users: UserAdminDto[] = [];
  availableRoles: string[] = [];
  loading = false;
  error = '';

  // Rollen-Modal
  editUser: UserAdminDto | null = null;
  editRoles: string[] = [];
  editLoading = false;
  editError = '';
  editVisible = false;

  // Neu-Benutzer-Modal
  newVisible = false;
  newUsername = '';
  newPassword = '';
  newRoles: string[] = [];
  newLoading = false;
  newError = '';

  // Löschen-Bestätigung
  deleteTarget: UserAdminDto | null = null;
  deleteLoading = false;

  constructor(private userAdminService: UserAdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.userAdminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Fehler beim Laden der Benutzer';
        this.loading = false;
      }
    });

    this.userAdminService.getAvailableRoles().subscribe({
      next: (roles) => { this.availableRoles = roles; },
      error: () => { this.availableRoles = ['ADMIN', 'USER']; }
    });
  }

  // ── Rollen bearbeiten ──────────────────────────────

  openEditRoles(user: UserAdminDto): void {
    this.editUser = user;
    this.editRoles = [...user.roles];
    this.editError = '';
    this.editVisible = true;
  }

  closeEditRoles(): void {
    this.editVisible = false;
    this.editUser = null;
    this.editRoles = [];
    this.editError = '';
  }

  toggleRole(role: string): void {
    const idx = this.editRoles.indexOf(role);
    if (idx >= 0) {
      this.editRoles.splice(idx, 1);
    } else {
      this.editRoles.push(role);
    }
  }

  hasRole(role: string): boolean {
    return this.editRoles.includes(role);
  }

  saveRoles(): void {
    if (!this.editUser || this.editRoles.length === 0) {
      this.editError = 'Mindestens eine Rolle muss ausgewählt sein.';
      return;
    }
    this.editLoading = true;
    this.editError = '';

    this.userAdminService.updateRoles(this.editUser.username, this.editRoles).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx >= 0) this.users[idx] = updated;
        this.editLoading = false;
        this.closeEditRoles();
      },
      error: (err) => {
        this.editError = err?.error?.message || 'Fehler beim Speichern';
        this.editLoading = false;
      }
    });
  }

  // ── Neuer Benutzer ─────────────────────────────────

  openNew(): void {
    this.newUsername = '';
    this.newPassword = '';
    this.newRoles = ['USER'];
    this.newError = '';
    this.newVisible = true;
  }

  closeNew(): void {
    this.newVisible = false;
    this.newError = '';
  }

  toggleNewRole(role: string): void {
    const idx = this.newRoles.indexOf(role);
    if (idx >= 0) {
      this.newRoles.splice(idx, 1);
    } else {
      this.newRoles.push(role);
    }
  }

  hasNewRole(role: string): boolean {
    return this.newRoles.includes(role);
  }

  createUser(): void {
    if (!this.newUsername.trim() || !this.newPassword.trim()) {
      this.newError = 'Benutzername und Passwort sind erforderlich.';
      return;
    }
    if (this.newRoles.length === 0) {
      this.newError = 'Mindestens eine Rolle muss ausgewählt sein.';
      return;
    }
    this.newLoading = true;
    this.newError = '';

    this.userAdminService.createUser(this.newUsername.trim(), this.newPassword, this.newRoles).subscribe({
      next: (created) => {
        this.users.push(created);
        this.newLoading = false;
        this.closeNew();
      },
      error: (err) => {
        this.newError = err?.error?.message || err?.error || 'Fehler beim Erstellen';
        this.newLoading = false;
      }
    });
  }

  // ── Löschen ────────────────────────────────────────

  confirmDelete(user: UserAdminDto): void {
    this.deleteTarget = user;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  deleteUser(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;

    this.userAdminService.deleteUser(this.deleteTarget.username).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.deleteTarget!.id);
        this.deleteLoading = false;
        this.deleteTarget = null;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Fehler beim Löschen';
        this.deleteLoading = false;
        this.deleteTarget = null;
      }
    });
  }

  // ── Helper ─────────────────────────────────────────

  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN' ? 'bg-danger text-white' : 'bg-secondary text-white';
  }

  trackById(_i: number, u: UserAdminDto): number { return u.id; }
}
