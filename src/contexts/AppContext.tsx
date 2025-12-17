import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client, CRMCard, CRMColumn, FinanceEntry, Report } from '@/types';

interface AppContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  crmColumns: CRMColumn[];
  setCrmColumns: React.Dispatch<React.SetStateAction<CRMColumn[]>>;
  crmCards: CRMCard[];
  setCrmCards: React.Dispatch<React.SetStateAction<CRMCard[]>>;
  finances: FinanceEntry[];
  setFinances: React.Dispatch<React.SetStateAction<FinanceEntry[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialColumns: CRMColumn[] = [
  { id: 'lead', title: 'Lead', order: 0 },
  { id: 'contact', title: 'Em Contato', order: 1 },
  { id: 'proposal', title: 'Proposta Enviada', order: 2 },
  { id: 'negotiation', title: 'Em Negociação', order: 3 },
  { id: 'closed', title: 'Fechado', order: 4 },
];

const initialClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    company: 'Tech Solutions',
    serviceType: 'Marketing Digital',
    recurrence: 'mensal',
    monthlyValue: 3500,
    contractDay: 10,
    status: 'ativo',
    email: 'joao@techsolutions.com',
    phone: '(11) 99999-0001',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    company: 'E-commerce Plus',
    serviceType: 'Gestão de Redes Sociais',
    recurrence: 'mensal',
    monthlyValue: 2800,
    contractDay: 5,
    status: 'ativo',
    email: 'maria@ecommerceplus.com',
    phone: '(11) 99999-0002',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    company: 'Startup Hub',
    serviceType: 'Branding',
    recurrence: 'pontual',
    monthlyValue: 15000,
    contractDay: 1,
    status: 'ativo',
    email: 'carlos@startuphub.com',
    phone: '(11) 99999-0003',
    createdAt: new Date('2024-03-10'),
  },
];

const initialCards: CRMCard[] = [
  {
    id: 'card1',
    clientName: 'Empresa ABC',
    description: 'Interessado em marketing digital',
    email: 'contato@abc.com',
    phone: '(11) 98765-4321',
    serviceType: 'Marketing Digital',
    columnId: 'lead',
    order: 0,
  },
  {
    id: 'card2',
    clientName: 'Loja XYZ',
    description: 'Precisa de gestão de redes sociais',
    email: 'contato@xyz.com',
    phone: '(11) 91234-5678',
    serviceType: 'Redes Sociais',
    columnId: 'contact',
    order: 0,
  },
  {
    id: 'card3',
    clientName: 'Consultoria DEF',
    description: 'Proposta de branding enviada',
    email: 'contato@def.com',
    phone: '(11) 95555-1234',
    serviceType: 'Branding',
    columnId: 'proposal',
    order: 0,
  },
];

const initialFinances: FinanceEntry[] = [
  {
    id: 'fin1',
    clientId: '1',
    clientName: 'Tech Solutions',
    value: 3500,
    date: new Date('2024-12-10'),
    type: 'Mensalidade',
    description: 'Pagamento mensal - Marketing Digital',
  },
  {
    id: 'fin2',
    clientId: '2',
    clientName: 'E-commerce Plus',
    value: 2800,
    date: new Date('2024-12-05'),
    type: 'Mensalidade',
    description: 'Pagamento mensal - Gestão de Redes',
  },
  {
    id: 'fin3',
    clientId: '3',
    clientName: 'Startup Hub',
    value: 7500,
    date: new Date('2024-12-01'),
    type: 'Projeto',
    description: 'Primeira parcela - Branding',
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [crmColumns, setCrmColumns] = useState<CRMColumn[]>(initialColumns);
  const [crmCards, setCrmCards] = useState<CRMCard[]>(initialCards);
  const [finances, setFinances] = useState<FinanceEntry[]>(initialFinances);
  const [reports, setReports] = useState<Report[]>([]);

  return (
    <AppContext.Provider
      value={{
        clients,
        setClients,
        crmColumns,
        setCrmColumns,
        crmCards,
        setCrmCards,
        finances,
        setFinances,
        reports,
        setReports,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
