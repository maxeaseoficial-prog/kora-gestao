import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
  const handlePrevMonth = () => {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrevMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[140px] text-center">
        {monthNames[month]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
