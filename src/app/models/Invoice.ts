export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  itemType?: 'SERVICE' | 'PRODUCT' | 'SUBSCRIPTION' | 'DISCOUNT' | 'FEE';
  periodStart?: Date;
  periodEnd?: Date;
  productCode?: string;
  productName?: string;
}

export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  status?: 'ACTIVE' | 'DRAFT' | 'SENT' | 'CANCELLED';
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  discountAmount?: number;
  notes?: string;
  paymentTerms?: string;
  createdAt?: Date;
  updatedAt?: Date;
  invoiceBatchId?: string;
  invoiceType?: 'MANUAL' | 'AUTO_GENERATED' | 'RECURRING' | 'CREDIT_NOTE';
  customerId?: string;
  customerName?: string;
  billingAddressId?: string;
  invoiceItems?: InvoiceItem[];
}
