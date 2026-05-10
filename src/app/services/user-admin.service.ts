import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api-service';

export interface UserAdminDto {
  id: number;
  username: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UserAdminService extends BaseApiService {
  private apiUrl = `${this.apiBaseUrl}/api/admin/users`;

  getUsers(): Observable<UserAdminDto[]> {
    return this.http.get<UserAdminDto[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getAvailableRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`, { headers: this.getAuthHeaders() });
  }

  updateRoles(username: string, roles: string[]): Observable<UserAdminDto> {
    return this.http.put<UserAdminDto>(
      `${this.apiUrl}/${username}/roles`,
      { roles },
      { headers: this.getAuthHeaders() }
    );
  }

  createUser(username: string, password: string, roles: string[]): Observable<UserAdminDto> {
    return this.http.post<UserAdminDto>(
      this.apiUrl,
      { username, password, roles },
      { headers: this.getAuthHeaders() }
    );
  }

  deleteUser(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${username}`, { headers: this.getAuthHeaders() });
  }
}
