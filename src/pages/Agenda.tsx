import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Link2, LinkIcon, LogOut, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type GEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  _local?: boolean;
  color?: string;
};

type ViewMode = 'month' | 'week' | 'day';

const HOUR_HEIGHT = 48; // px per hour in week/day time grid
const SNAP_MIN = 15;    // snap drag to 15 minutes

const EVENT_COLORS: { key: string; label: string; dot: string; chip: string }[] = [
  { key: 'neutral', label: 'Cinza',   dot: 'bg-neutral-500', chip: 'bg-neutral-500/15 hover:bg-neutral-500/25 border-l-2 border-neutral-500 text-foreground' },
  { key: 'blue',    label: 'Azul',    dot: 'bg-blue-500',    chip: 'bg-blue-500/15 hover:bg-blue-500/25 border-l-2 border-blue-500 text-foreground' },
  { key: 'green',   label: 'Verde',   dot: 'bg-emerald-500', chip: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-l-2 border-emerald-500 text-foreground' },
  { key: 'red',     label: 'Vermelho',dot: 'bg-red-500',     chip: 'bg-red-500/15 hover:bg-red-500/25 border-l-2 border-red-500 text-foreground' },
  { key: 'amber',   label: 'Âmbar',   dot: 'bg-amber-500',   chip: 'bg-amber-500/15 hover:bg-amber-500/25 border-l-2 border-amber-500 text-foreground' },
  { key: 'purple',  label: 'Roxo',    dot: 'bg-violet-500',  chip: 'bg-violet-500/15 hover:bg-violet-500/25 border-l-2 border-violet-500 text-foreground' },
];

function colorChip(key?: string) {
  return (EVENT_COLORS.find((c) => c.key === key) || EVENT_COLORS[0]).chip;
}
function colorDot(key?: string) {
  return (EVENT_COLORS.find((c) => c.key === key) || EVENT_COLORS[0]).dot;
}

const REDIRECT_PATH = '/agenda';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

function getRedirectUri() {
  return `${window.location.origin}${REDIRECT_PATH}`;
}

function buildGoogleAuthUrl(clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState<boolean>(() => {
    return localStorage.getItem('agenda_use_local') === '1';
  });
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<GEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GEvent | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    color: 'neutral',
  });

  // On mount: check status + handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCode(code);
    } else {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkStatus() {
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { action: 'status' },
    });
    if (error) {
      setConnected(false);
      return;
    }
    setConnected(!!data?.connected);
    setGoogleEmail(data?.google_email || null);
  }

  async function exchangeCode(code: string) {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'exchange', code, redirect_uri: getRedirectUri() },
      });
      if (error) throw error;
      setConnected(true);
      setGoogleEmail(data?.google_email || null);
      toast.success('Google Agenda conectada!');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao conectar Google Agenda');
    } finally {
      setConnecting(false);
      // clean URL
      searchParams.delete('code');
      searchParams.delete('scope');
      searchParams.delete('state');
      searchParams.delete('authuser');
      searchParams.delete('prompt');
      setSearchParams(searchParams, { replace: true });
    }
  }

  async function handleConnect() {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'config' },
      });
      if (error || !data?.client_id) {
        toast.error('Client ID do Google não configurado');
        return;
      }
      window.location.href = buildGoogleAuthUrl(data.client_id);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao iniciar conexão');
    }
  }

  async function handleDisconnect() {
    const { error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { action: 'disconnect' },
    });
    if (error) {
      toast.error('Erro ao desconectar');
      return;
    }
    setConnected(false);
    setGoogleEmail(null);
    setEvents([]);
    toast.success('Google Agenda desconectada');
  }

  function enableLocalMode() {
    setUseLocal(true);
    localStorage.setItem('agenda_use_local', '1');
  }

  async function fetchLocalEvents() {
    const { data, error } = await (supabase as any)
      .from('agenda_local_events')
      .select('*')
      .gte('starts_at', rangeStart.toISOString())
      .lte('starts_at', addDays(rangeEnd, 1).toISOString())
      .order('starts_at');
    if (error) {
      console.error(error);
      return;
    }
    const mapped: GEvent[] = (data || []).map((r: any) => ({
      id: 'local:' + r.id,
      summary: r.title,
      description: r.description || undefined,
      location: r.location || undefined,
      start: r.all_day
        ? { date: format(parseISO(r.starts_at), 'yyyy-MM-dd') }
        : { dateTime: r.starts_at },
      end: r.all_day
        ? { date: format(parseISO(r.ends_at), 'yyyy-MM-dd') }
        : { dateTime: r.ends_at },
      _local: true,
      color: r.color || 'neutral',
    }));
    setLocalEvents(mapped);
  }

  function openNewEvent(prefill?: { date?: Date; startTime?: string; endTime?: string; allDay?: boolean }) {
    setEditingLocalId(null);
    setForm({
      title: '',
      description: '',
      location: '',
      date: format(prefill?.date || cursor, 'yyyy-MM-dd'),
      startTime: prefill?.startTime || '09:00',
      endTime: prefill?.endTime || '10:00',
      allDay: !!prefill?.allDay,
      color: 'neutral',
    });
    setShowNewEvent(true);
  }

  function openEditEvent(ev: GEvent) {
    if (!ev._local) return;
    const id = ev.id.replace(/^local:/, '');
    const startStr = ev.start.dateTime || (ev.start.date ? ev.start.date + 'T09:00' : '');
    const endStr = ev.end.dateTime || (ev.end.date ? ev.end.date + 'T10:00' : '');
    const s = parseISO(startStr);
    const e = parseISO(endStr);
    setEditingLocalId(id);
    setForm({
      title: ev.summary || '',
      description: ev.description || '',
      location: ev.location || '',
      date: format(s, 'yyyy-MM-dd'),
      startTime: format(s, 'HH:mm'),
      endTime: format(e, 'HH:mm'),
      allDay: !!ev.start.date,
      color: ev.color || 'neutral',
    });
    setSelectedEvent(null);
    setShowNewEvent(true);
  }

  async function saveLocalEvent() {
    if (!form.title.trim()) {
      toast.error('Informe o título');
      return;
    }
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return;
    const starts = form.allDay
      ? new Date(form.date + 'T00:00:00').toISOString()
      : new Date(form.date + 'T' + form.startTime + ':00').toISOString();
    const ends = form.allDay
      ? new Date(form.date + 'T23:59:59').toISOString()
      : new Date(form.date + 'T' + form.endTime + ':00').toISOString();
    const payload = {
      user_id: uid,
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      starts_at: starts,
      ends_at: ends,
      all_day: form.allDay,
      color: form.color || 'neutral',
    };
    let error;
    if (editingLocalId) {
      ({ error } = await (supabase as any)
        .from('agenda_local_events')
        .update(payload)
        .eq('id', editingLocalId));
    } else {
      ({ error } = await (supabase as any).from('agenda_local_events').insert(payload));
    }
    if (error) {
      toast.error('Erro ao salvar evento');
      return;
    }
    toast.success(editingLocalId ? 'Evento atualizado' : 'Evento criado');
    setShowNewEvent(false);
    fetchLocalEvents();
  }

  async function deleteLocalEvent(ev: GEvent) {
    if (!ev._local) return;
    const id = ev.id.replace(/^local:/, '');
    const { error } = await (supabase as any).from('agenda_local_events').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
      return;
    }
    setSelectedEvent(null);
    fetchLocalEvents();
    toast.success('Evento excluído');
  }

  // Compute visible range
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (view === 'month') {
      const mStart = startOfMonth(cursor);
      const mEnd = endOfMonth(cursor);
      const gStart = startOfWeek(mStart, { weekStartsOn: 0 });
      const gEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
      return {
        rangeStart: gStart,
        rangeEnd: gEnd,
        days: eachDayOfInterval({ start: gStart, end: gEnd }),
      };
    }
    if (view === 'week') {
      const wStart = startOfWeek(cursor, { weekStartsOn: 0 });
      const wEnd = endOfWeek(cursor, { weekStartsOn: 0 });
      return {
        rangeStart: wStart,
        rangeEnd: wEnd,
        days: eachDayOfInterval({ start: wStart, end: wEnd }),
      };
    }
    const d = startOfDay(cursor);
    return { rangeStart: d, rangeEnd: addDays(d, 1), days: [d] };
  }, [view, cursor]);

  // Fetch events when connected/view/cursor changes
  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('google-calendar-events', {
          body: {
            timeMin: rangeStart.toISOString(),
            timeMax: addDays(rangeEnd, 1).toISOString(),
          },
        });
        if (error) throw error;
        if (!cancelled) setEvents(data?.events || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error('Erro ao carregar eventos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, rangeStart.getTime(), rangeEnd.getTime()]);

  // Fetch local events whenever visible range changes
  useEffect(() => {
    if (connected === null) return;
    fetchLocalEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime(), connected, useLocal]);

  const allEvents = useMemo(() => [...events, ...localEvents], [events, localEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GEvent[]>();
    for (const ev of allEvents) {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) continue;
      const d = ev.start.date ? parseISO(ev.start.date + 'T00:00:00') : parseISO(startStr);
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [allEvents]);

  function goPrev() {
    if (view === 'month') setCursor(subMonths(cursor, 1));
    else if (view === 'week') setCursor(subWeeks(cursor, 1));
    else setCursor(addDays(cursor, -1));
  }
  function goNext() {
    if (view === 'month') setCursor(addMonths(cursor, 1));
    else if (view === 'week') setCursor(addWeeks(cursor, 1));
    else setCursor(addDays(cursor, 1));
  }
  function goToday() {
    setCursor(new Date());
  }

  const headerLabel =
    view === 'day'
      ? format(cursor, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
      : view === 'week'
      ? `${format(rangeStart, 'd MMM', { locale: ptBR })} – ${format(rangeEnd, 'd MMM yyyy', { locale: ptBR })}`
      : format(cursor, "MMMM 'de' yyyy", { locale: ptBR });

  if (connected === null || connecting) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!connected && !useLocal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <CalendarIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold">Sua Agenda</h2>
          <p className="text-sm text-muted-foreground">
            Conecte-se ao Google Agenda para ver seus compromissos, ou use a agenda interna do Kora sem integração.
          </p>
          <Button onClick={handleConnect} className="w-full gap-2">
            <Link2 className="h-4 w-4" />
            Conectar Google Agenda
          </Button>
          <Button variant="outline" onClick={enableLocalMode} className="w-full gap-2">
            <CalendarIcon className="h-4 w-4" />
            Usar sem conectar
          </Button>
          <p className="text-xs text-muted-foreground pt-2">
            Você pode conectar o Google mais tarde a qualquer momento.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goPrev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="text-xl font-semibold capitalize">{headerLabel}</h1>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="day">Dia</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => openNewEvent()} className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo evento</span>
          </Button>
          {connected ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-2 py-1">
                <LinkIcon className="h-3 w-3" />
                {googleEmail || 'Google conectado'}
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="gap-1">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Desconectar</span>
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect} className="gap-1">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Conectar Google</span>
            </Button>
          )}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        {view === 'month' && (
          <MonthGrid
            days={days}
            cursor={cursor}
            eventsByDay={eventsByDay}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {view === 'week' && (
          <TimeGrid
            days={days}
            eventsByDay={eventsByDay}
            onSelectEvent={setSelectedEvent}
            onCreateRange={(date, startTime, endTime) => openNewEvent({ date, startTime, endTime })}
          />
        )}
        {view === 'day' && (
          <TimeGrid
            days={[cursor]}
            eventsByDay={eventsByDay}
            onSelectEvent={setSelectedEvent}
            onCreateRange={(date, startTime, endTime) => openNewEvent({ date, startTime, endTime })}
            singleDay
          />
        )}
      </div>

      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => openEditEvent(selectedEvent)}
          onDelete={() => deleteLocalEvent(selectedEvent)}
        />
      )}

      <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocalId ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Reunião com cliente" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allday">Dia inteiro</Label>
              <Switch id="allday" checked={form.allDay} onCheckedChange={(v) => setForm({ ...form, allDay: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              {!form.allDay && (
                <>
                  <div>
                    <Label>Início</Label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div>
              <Label>Local</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEvent(false)}>Cancelar</Button>
            <Button onClick={saveLocalEvent}>{editingLocalId ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------- Month view -------- */
function MonthGrid({
  days,
  cursor,
  eventsByDay,
  onSelectEvent,
}: {
  days: Date[];
  cursor: Date;
  eventsByDay: Map<string, GEvent[]>;
  onSelectEvent: (e: GEvent) => void;
}) {
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  return (
    <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] h-full min-h-[600px]">
      {weekDayLabels.map((d) => (
        <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground border-b border-r last:border-r-0 text-center uppercase tracking-wide">
          {d}
        </div>
      ))}
      {days.map((day, i) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayEvents = eventsByDay.get(key) || [];
        const inMonth = isSameMonth(day, cursor);
        const isToday = isSameDay(day, today);
        return (
          <div
            key={i}
            className={cn(
              'border-b border-r last:border-r-0 p-1.5 flex flex-col gap-1 overflow-hidden',
              !inMonth && 'bg-muted/30 text-muted-foreground',
            )}
          >
            <div className="flex justify-end">
              <span
                className={cn(
                  'text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden">
              {dayEvents.slice(0, 3).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="text-left text-[11px] leading-tight truncate rounded px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-foreground"
                >
                  {ev.start.dateTime && (
                    <span className="font-medium mr-1">
                      {format(parseISO(ev.start.dateTime), 'HH:mm')}
                    </span>
                  )}
                  {ev.summary || '(sem título)'}
                </button>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[10px] text-muted-foreground px-1">
                  +{dayEvents.length - 3} mais
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------- Week view -------- */
function WeekGrid({
  days,
  eventsByDay,
  onSelectEvent,
}: {
  days: Date[];
  eventsByDay: Map<string, GEvent[]>;
  onSelectEvent: (e: GEvent) => void;
}) {
  const today = new Date();
  return (
    <div className="grid grid-cols-7 h-full min-h-[600px]">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayEvents = eventsByDay.get(key) || [];
        const isToday = isSameDay(day, today);
        return (
          <div key={key} className="border-r last:border-r-0 flex flex-col overflow-hidden">
            <div className={cn('px-2 py-2 border-b text-center', isToday && 'bg-primary/5')}>
              <div className="text-[10px] uppercase text-muted-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold mt-0.5 h-8 w-8 mx-auto flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {dayEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="w-full text-left text-xs rounded px-2 py-1 bg-primary/10 hover:bg-primary/20"
                >
                  {ev.start.dateTime && (
                    <div className="font-medium">
                      {format(parseISO(ev.start.dateTime), 'HH:mm')}
                      {ev.end.dateTime && ' – ' + format(parseISO(ev.end.dateTime), 'HH:mm')}
                    </div>
                  )}
                  <div className="truncate">{ev.summary || '(sem título)'}</div>
                </button>
              ))}
              {dayEvents.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center pt-4">—</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------- Day view -------- */
function DayList({
  day,
  events,
  onSelectEvent,
}: {
  day: Date;
  events: GEvent[];
  onSelectEvent: (e: GEvent) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const timed = events.filter((e) => e.start.dateTime);
  const allDay = events.filter((e) => !e.start.dateTime);
  return (
    <div className="flex flex-col h-full">
      {allDay.length > 0 && (
        <div className="p-3 border-b space-y-1">
          <div className="text-[10px] uppercase text-muted-foreground">Dia inteiro</div>
          {allDay.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className="block w-full text-left text-sm rounded px-2 py-1 bg-primary/10 hover:bg-primary/20"
            >
              {ev.summary || '(sem título)'}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {hours.map((h) => {
          const evs = timed.filter((e) => {
            const d = parseISO(e.start.dateTime!);
            return d.getHours() === h;
          });
          return (
            <div key={h} className="grid grid-cols-[60px_1fr] border-b min-h-[52px]">
              <div className="text-xs text-muted-foreground pt-1 pr-2 text-right border-r">
                {String(h).padStart(2, '0')}:00
              </div>
              <div className="p-1 space-y-1">
                {evs.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="w-full text-left text-sm rounded px-2 py-1 bg-primary/10 hover:bg-primary/20"
                  >
                    <div className="font-medium text-xs">
                      {format(parseISO(ev.start.dateTime!), 'HH:mm')}
                      {ev.end.dateTime && ' – ' + format(parseISO(ev.end.dateTime), 'HH:mm')}
                    </div>
                    <div>{ev.summary || '(sem título)'}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Event dialog -------- */
function EventDialog({ event, onClose, onEdit, onDelete }: { event: GEvent; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const start = event.start.dateTime || event.start.date;
  const end = event.end.dateTime || event.end.date;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card className="max-w-md w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">{event.summary || '(sem título)'}</h3>
        {start && (
          <div className="text-sm text-muted-foreground">
            {event.start.dateTime
              ? `${format(parseISO(start), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}${end && event.end.dateTime ? ' – ' + format(parseISO(end), 'HH:mm') : ''}`
              : format(parseISO(start + 'T00:00:00'), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}
        {event.location && <p className="text-sm">📍 {event.location}</p>}
        {event.description && (
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{event.description}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          {event._local && (
            <>
              <Button variant="outline" size="sm" onClick={onDelete} className="gap-1">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>Editar</Button>
            </>
          )}
          {event.htmlLink && (
            <a href={event.htmlLink} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">Abrir no Google</Button>
            </a>
          )}
          <Button size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </Card>
    </div>
  );
}