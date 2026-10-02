import { useEffect, useState } from 'react';
import { supabase, type Client, type Appointment } from '@/lib/supabase';
import { Users, Home, CalendarDays, TrendingUp, UserPlus, ArrowRight } from 'lucide-react';

type Props = { onPageChange: (page: string) => void };

export default function Dashboard({ onPageChange }: Props) {
  const [stats, setStats] = useState({ clients: 0, properties: 0, appointments: 0, available: 0, sellers: 0, overdueReminders: 0 });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cRes, pRes, aRes, availRes, recentRes, upcomingRes, sellersRes, overdueRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'disponibile'),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('appointments').select('*').gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(5),
        supabase.from('sellers').select('*', { count: 'exact', head: true }),
        supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('reminder_enabled', true).lt('next_reminder_date', new Date().toISOString()),
      ]);
      setStats({ clients: cRes.count ?? 0, properties: pRes.count ?? 0, appointments: aRes.count ?? 0, available: availRes.count ?? 0, sellers: sellersRes.count ?? 0, overdueReminders: overdueRes.count ?? 0 });
      setRecentClients(recentRes.data ?? []);
      setUpcoming(upcomingRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Clienti', value: stats.clients, icon: <Users className="w-5 h-5" strokeWidth={1.5} />, page: 'clients' },
    { label: 'Venditori', value: stats.sellers, icon: <UserPlus className="w-5 h-5" strokeWidth={1.5} />, page: 'sellers' },
    { label: 'Immobili', value: stats.properties, icon: <Home className="w-5 h-5" strokeWidth={1.5} />, page: 'properties' },
    { label: 'Appuntamenti', value: stats.appointments, icon: <CalendarDays className="w-5 h-5" strokeWidth={1.5} />, page: 'appointments' },
  ];

  const statusColors: Record<string, string> = {
    attivo: 'bg-[#34c759]/10 text-[#248a3d]',
    in_trattativa: 'bg-[#ff9500]/10 text-[#cc7a00]',
    concluso: 'bg-[#0071e3]/10 text-[#0058b0]',
    non_interessato: 'bg-[#86868b]/10 text-[#6e6e73]',
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1100px] mx-auto animate-fade-in">
      <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Dashboard</h1>
      <p className="text-[#86868b] text-[15px] mt-1 mb-6">Panoramica della tua agenzia immobiliare</p>

      {stats.overdueReminders > 0 && (
        <button onClick={() => onPageChange('sellers')} className="w-full bg-[#fff2f0] border border-[#ffd0cc] rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 hover:border-[#ffb3ad] transition text-left animate-fade-in">
          <div className="w-9 h-9 bg-[#ff3b30]/10 rounded-[10px] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#ff3b30]" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[15px] text-[#1d1d1f]">{stats.overdueReminders} {stats.overdueReminders === 1 ? 'venditore da contattare' : 'venditori da contattare'}</p>
            <p className="text-[13px] text-[#86868b]">Hai promemoria scaduti per le chiamate di follow-up</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#ff3b30]" strokeWidth={2} />
        </button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[#86868b]">
          <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
          Caricamento...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => onPageChange(c.page)}
                className="bg-white rounded-2xl p-5 border border-[#e5e5e7] hover:border-[#d1d1d6] hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-[#f5f5f7] rounded-[10px] flex items-center justify-center text-[#1d1d1f]">
                    {c.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#86868b] opacity-0 group-hover:opacity-100 transition" strokeWidth={1.5} />
                </div>
                <p className="text-[32px] font-semibold text-[#1d1d1f] leading-none">{c.value}</p>
                <p className="text-[#86868b] text-[13px] mt-1.5">{c.label}</p>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5e7] p-6">
              <h2 className="font-semibold text-[17px] text-[#1d1d1f] mb-4">Clienti recenti</h2>
              {recentClients.length === 0 ? (
                <p className="text-[#86868b] text-[14px] py-4">Nessun cliente inserito</p>
              ) : (
                <div className="space-y-1">
                  {recentClients.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-[#f5f5f7] last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-[14px] text-[#1d1d1f] truncate">{c.first_name} {c.last_name}</p>
                        <p className="text-[13px] text-[#86868b]">{c.phone ?? 'Nessun telefono'}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusColors[c.status] ?? statusColors.non_interessato}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e5e7] p-6">
              <h2 className="font-semibold text-[17px] text-[#1d1d1f] mb-4">Prossimi appuntamenti</h2>
              {upcoming.length === 0 ? (
                <p className="text-[#86868b] text-[14px] py-4">Nessun appuntamento programmato</p>
              ) : (
                <div className="space-y-1">
                  {upcoming.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-[#f5f5f7] last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-[14px] text-[#1d1d1f] truncate">{a.title}</p>
                        <p className="text-[13px] text-[#86868b]">
                          {new Date(a.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} alle{' '}
                          {new Date(a.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full font-medium bg-[#ff9500]/10 text-[#cc7a00]">{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
