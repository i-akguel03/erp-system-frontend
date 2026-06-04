import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { BaseApiService } from './base-api-service';
import { CrmNote } from '../models/CrmNote';
import { CrmActivity } from '../models/CrmActivity';
import { CrmContact } from '../models/CrmContact';
import { CrmDocument } from '../models/CrmDocument';

@Injectable({ providedIn: 'root' })
export class CrmService extends BaseApiService {
  private base = `${this.apiBaseUrl}/api/crm`;

  // ─── Notes ────────────────────────────────────────────────────────────────

  getNotesByCustomer(customerId: string): Observable<CrmNote[]> {
    return this.http.get<CrmNote[]>(`${this.base}/notes/by-customer/${customerId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(notes => notes.map(n => this.mapNote(n))));
  }

  getNotesByContract(contractId: string): Observable<CrmNote[]> {
    return this.http.get<CrmNote[]>(`${this.base}/notes/by-contract/${contractId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(notes => notes.map(n => this.mapNote(n))));
  }

  createNote(note: Partial<CrmNote>, customerId?: string, contractId?: string): Observable<CrmNote> {
    const params: any = {};
    if (customerId) params['customerId'] = customerId;
    if (contractId) params['contractId'] = contractId;
    return this.http.post<CrmNote>(`${this.base}/notes`, note, {
      headers: this.getAuthHeaders(), params
    }).pipe(map(n => this.mapNote(n)));
  }

  updateNote(id: string, note: Partial<CrmNote>): Observable<CrmNote> {
    return this.http.put<CrmNote>(`${this.base}/notes/${id}`, note, {
      headers: this.getAuthHeaders()
    }).pipe(map(n => this.mapNote(n)));
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/notes/${id}`, { headers: this.getAuthHeaders() });
  }

  // ─── Activities ───────────────────────────────────────────────────────────

  getActivitiesByCustomer(customerId: string): Observable<CrmActivity[]> {
    return this.http.get<CrmActivity[]>(`${this.base}/activities/by-customer/${customerId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(list => list.map(a => this.mapActivity(a))));
  }

  getActivitiesByContract(contractId: string): Observable<CrmActivity[]> {
    return this.http.get<CrmActivity[]>(`${this.base}/activities/by-contract/${contractId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(list => list.map(a => this.mapActivity(a))));
  }

  createActivity(activity: Partial<CrmActivity>, customerId?: string, contractId?: string): Observable<CrmActivity> {
    const params: any = {};
    if (customerId) params['customerId'] = customerId;
    if (contractId) params['contractId'] = contractId;
    return this.http.post<CrmActivity>(`${this.base}/activities`, activity, {
      headers: this.getAuthHeaders(), params
    }).pipe(map(a => this.mapActivity(a)));
  }

  updateActivity(id: string, activity: Partial<CrmActivity>): Observable<CrmActivity> {
    return this.http.put<CrmActivity>(`${this.base}/activities/${id}`, activity, {
      headers: this.getAuthHeaders()
    }).pipe(map(a => this.mapActivity(a)));
  }

  completeActivity(id: string, result?: string): Observable<CrmActivity> {
    const params: any = {};
    if (result) params['result'] = result;
    return this.http.patch<CrmActivity>(`${this.base}/activities/${id}/complete`, {}, {
      headers: this.getAuthHeaders(), params
    }).pipe(map(a => this.mapActivity(a)));
  }

  deleteActivity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/activities/${id}`, { headers: this.getAuthHeaders() });
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────

  getContactsByCustomer(customerId: string): Observable<CrmContact[]> {
    return this.http.get<CrmContact[]>(`${this.base}/contacts/by-customer/${customerId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(list => list.map(c => this.mapContact(c))));
  }

  createContact(contact: Partial<CrmContact>, customerId: string): Observable<CrmContact> {
    return this.http.post<CrmContact>(`${this.base}/contacts`, contact, {
      headers: this.getAuthHeaders(), params: { customerId }
    }).pipe(map(c => this.mapContact(c)));
  }

  updateContact(id: string, contact: Partial<CrmContact>): Observable<CrmContact> {
    return this.http.put<CrmContact>(`${this.base}/contacts/${id}`, contact, {
      headers: this.getAuthHeaders()
    }).pipe(map(c => this.mapContact(c)));
  }

  setPrimaryContact(id: string): Observable<CrmContact> {
    return this.http.patch<CrmContact>(`${this.base}/contacts/${id}/set-primary`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(map(c => this.mapContact(c)));
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/contacts/${id}`, { headers: this.getAuthHeaders() });
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  getDocumentsByCustomer(customerId: string): Observable<CrmDocument[]> {
    return this.http.get<CrmDocument[]>(`${this.base}/documents/by-customer/${customerId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(list => list.map(d => this.mapDocument(d))));
  }

  getDocumentsByContract(contractId: string): Observable<CrmDocument[]> {
    return this.http.get<CrmDocument[]>(`${this.base}/documents/by-contract/${contractId}`, {
      headers: this.getAuthHeaders()
    }).pipe(map(list => list.map(d => this.mapDocument(d))));
  }

  uploadDocument(file: File, customerId?: string, contractId?: string, documentType?: string, description?: string): Observable<CrmDocument> {
    const formData = new FormData();
    formData.append('file', file);
    const params: any = {};
    if (customerId) params['customerId'] = customerId;
    if (contractId) params['contractId'] = contractId;
    if (documentType) params['documentType'] = documentType;
    if (description) params['description'] = description;

    const token = this.authService.getAccessToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    return this.http.post<CrmDocument>(`${this.base}/documents/upload`, formData, {
      headers, params
    }).pipe(map(d => this.mapDocument(d)));
  }

  downloadDocumentUrl(documentId: string): string {
    return `${this.base}/documents/${documentId}/download`;
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${id}`, { headers: this.getAuthHeaders() });
  }

  fetchDocumentBlob(documentId: string): Observable<Blob> {
    return this.http.get(`${this.base}/documents/${documentId}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private mapNote(dto: any): CrmNote {
    return { ...dto, createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined, updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined };
  }

  private mapActivity(dto: any): CrmActivity {
    return {
      ...dto,
      activityDate: dto.activityDate ? new Date(dto.activityDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    };
  }

  private mapContact(dto: any): CrmContact {
    return { ...dto, createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined, updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined };
  }

  private mapDocument(dto: any): CrmDocument {
    return { ...dto, createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined, updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined };
  }
}
