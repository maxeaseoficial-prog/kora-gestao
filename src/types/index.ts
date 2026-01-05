export interface Client {
  id: string;
  name: string;
  company: string;
  serviceType: string;
  recurrence: 'mensal' | 'pontual';
  monthlyValue: number;
  contractDay: number;
  status: 'ativo' | 'inativo' | 'pendente';
  email?: string;
  phone?: string;
  createdAt: Date;
}

export interface CRMCard {
  id: string;
  clientName: string;
  description: string;
  email?: string;
  phone?: string;
  serviceType: string;
  columnId: string;
  order: number;
}

export interface CRMColumn {
  id: string;
  title: string;
  order: number;
}

export interface FinanceEntry {
  id: string;
  clientId: string;
  clientName: string;
  value: number;
  date: Date;
  type: string;
  description?: string;
}

export interface Report {
  id: string;
  clientId: string;
  fileName: string;
  originalName: string;
  uploadDate: Date;
  month: string;
  year: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}
