export type DocumentType = 'EMAIL' | 'BILD' | 'PDF' | 'VERTRAG' | 'ANGEBOT' | 'RECHNUNG' | 'SONSTIGES';

export interface CrmDocument {
  id?: string;
  originalFileName: string;
  mimeType?: string;
  fileSize?: number;
  description?: string;
  documentType?: DocumentType;
  uploadedBy?: string;
  customerId?: string;
  customerName?: string;
  contractId?: string;
  contractTitle?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
