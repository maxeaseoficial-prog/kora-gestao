export interface Client {
  id: string;
  clientType: 'empresa' | 'pessoa';
  name: string;
  company?: string;
  serviceType: string;
  recurrence: 'mensal' | 'pontual';
  monthlyValue: number;
  contractDay: number;
  status: 'ativo' | 'inativo' | 'pendente';
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  gender?: 'masculino' | 'feminino' | 'outro' | '';
  age?: number | null;
  createdAt: Date;
  entryDate: Date;
  deactivatedAt?: Date | null;
  endDate?: Date | null;
  avatarUrl?: string | null;
  avatarPath?: string | null;
  originType?: 'canal_vendas' | 'indicacao' | '' | null;
  originChannel?: string | null;
  referrerName?: string | null;
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
  role?: string;
  company?: string;
  revenue?: number | null;
  city?: string;
  notes?: string;
}

export interface CRMColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
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
