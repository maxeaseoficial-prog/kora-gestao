import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client, CRMCard, CRMColumn, FinanceEntry, Report } from '@/types';
import { useClients } from '@/hooks/useClients';
import { useCRM } from '@/hooks/useCRM';
import { useFinances } from '@/hooks/useFinances';
import { useReports } from '@/hooks/useReports';

interface AppContextType {
  clients: Client[];
  setClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  crmColumns: CRMColumn[];
  setCrmColumns: (columns: CRMColumn[] | ((prev: CRMColumn[]) => CRMColumn[])) => void;
  crmCards: CRMCard[];
  setCrmCards: (cards: CRMCard[] | ((prev: CRMCard[]) => CRMCard[])) => void;
  finances: FinanceEntry[];
  setFinances: (finances: FinanceEntry[] | ((prev: FinanceEntry[]) => FinanceEntry[])) => void;
  reports: Report[];
  setReports: (reports: Report[] | ((prev: Report[]) => Report[])) => void;
  hideNumbers: boolean;
  setHideNumbers: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_HIDE_NUMBERS = 'maxease-hide-numbers';

function loadHideNumbers(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HIDE_NUMBERS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading hideNumbers from localStorage:', error);
  }
  return false;
}

function saveHideNumbers(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_HIDE_NUMBERS, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving hideNumbers to localStorage:', error);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { clients, setClients, loading: clientsLoading } = useClients();
  const { crmColumns, setCrmColumns, crmCards, setCrmCards, loading: crmLoading } = useCRM();
  const { finances, setFinances, loading: financesLoading } = useFinances();
  const { reports, setReports, loading: reportsLoading } = useReports();
  
  const [hideNumbers, setHideNumbersState] = useState<boolean>(() => loadHideNumbers());

  const setHideNumbers: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    setHideNumbersState((prev) => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      saveHideNumbers(newValue);
      return newValue;
    });
  };

  const loading = clientsLoading || crmLoading || financesLoading || reportsLoading;

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
        loading,
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
