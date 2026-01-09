import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  hideNumbers: boolean;
  setHideNumbers: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  clients: 'maxease-clients',
  crmColumns: 'maxease-crm-columns',
  crmCards: 'maxease-crm-cards',
  finances: 'maxease-finances',
  reports: 'maxease-reports',
  hideNumbers: 'maxease-hide-numbers',
};

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

// Helper functions for localStorage
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects for specific types
      if (key === STORAGE_KEYS.clients) {
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })) as T;
      }
      if (key === STORAGE_KEYS.finances) {
        return parsed.map((item: any) => {
          // Parse date as local time to avoid timezone offset issues
          const dateStr = item.date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          return {
            ...item,
            date: new Date(year, month - 1, day, 12, 0, 0), // noon to avoid DST issues
          };
        }) as T;
      }
      return parsed;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => 
    loadFromStorage(STORAGE_KEYS.clients, initialClients)
  );
  const [crmColumns, setCrmColumns] = useState<CRMColumn[]>(() => 
    loadFromStorage(STORAGE_KEYS.crmColumns, initialColumns)
  );
  const [crmCards, setCrmCards] = useState<CRMCard[]>(() => 
    loadFromStorage(STORAGE_KEYS.crmCards, initialCards)
  );
  const [finances, setFinances] = useState<FinanceEntry[]>(() => 
    loadFromStorage(STORAGE_KEYS.finances, initialFinances)
  );
  const [reports, setReports] = useState<Report[]>(() => 
    loadFromStorage(STORAGE_KEYS.reports, [])
  );
  const [hideNumbers, setHideNumbers] = useState<boolean>(() => 
    loadFromStorage(STORAGE_KEYS.hideNumbers, false)
  );

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.clients, clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.crmColumns, crmColumns);
  }, [crmColumns]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.crmCards, crmCards);
  }, [crmCards]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.finances, finances);
  }, [finances]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.reports, reports);
  }, [reports]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.hideNumbers, hideNumbers);
  }, [hideNumbers]);

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
        hideNumbers,
        setHideNumbers,
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
