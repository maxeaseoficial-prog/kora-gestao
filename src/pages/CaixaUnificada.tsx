import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Caixa } from './Caixa';
import Saidas from './Saidas';

export default function CaixaUnificada() {
  const [tab, setTab] = useState<'entradas' | 'saidas'>('entradas');

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'entradas' | 'saidas')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
        </TabsList>
        <TabsContent value="entradas" className="mt-4">
          <Caixa />
        </TabsContent>
        <TabsContent value="saidas" className="mt-4">
          <Saidas />
        </TabsContent>
      </Tabs>
    </div>
  );
}