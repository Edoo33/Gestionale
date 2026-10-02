import { useEffect, useState } from 'react';
import { supabase, type Seller } from '@/lib/supabase';
import {
  Plus, Search, Edit2, Trash2, X, UserPlus, Bell, BellOff,
  Phone, MapPin, Home, Clock, Check,
} from 'lucide-react';

const propertyTypes = [
  'casa', 'appartamento', 'villa', 'garage', 'capannone', 'hotel',
  'negozio', 'ufficio', 'loft', 'attico', 'rustico', 'terreno',
  'box', 'magazzino', 'laboratorio',
];
const statusOptions = ['da_contattare', 'contattato', 'in_valutazione', 'non_interessato', 'concluso'];
const intervalOptions = [
  { value: 3, label: 'Ogni 3 giorni' },
  { value: 7, label: 'Ogni 7 giorni' },
  { value: 14, label: 'Ogni 14 giorni' },
  { value: 30, label: 'Ogni 30 giorni' },
];

type SellerForm = {
  first_name: string; last_name: string; phone: string; email: string;
  property_type: string; property_address: string; property_city: string;
  property_sqm: string; asking_price: string;
  reminder_enabled: boolean; reminder_interval_days: string;
  notes: string; status: string;
};

const emptyForm: SellerForm = {
  first_name: '', last_name: '', phone: '', email: '',
  property_type: '', property_address: '', property_city: '',
  property_sqm: '', asking_price: '',
  reminder_enabled: false, reminder_interval_days: '7',
  notes: '', status: 'da_contattare',
};

const statusColors: Record<string, string> = {
  da_contattare: 'bg-[#ff9500]/10 text-[#cc7a00]',
  contattato: 'bg-[#0071e3]/10 text-[#0058b0]',
  in_valutazione: 'bg-[#5856d6]/10 text-[#3634a3]',
  non_interessato: 'bg-[#86868b]/10 text-[#6e6e73]',
  concluso: 'bg-[#34c759]/10 text-[#248a3d]',
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SellerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterReminder, setFilterReminder] = useState('');

  useEffect(() => { loadSellers(); }, []);

  async function loadSellers() {
    setLoading(true);
    const { data } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
    setSellers(data ?? []);
    setLoading(false);
  }

  function openCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true); }

  function openEdit(s: Seller) {
    setForm({
      first_name: s.first_name, last_name: s.last_name, phone: s.phone ?? '', email: s.email ?? '',
      property_type: s.property_type ?? '', property_address: s.property_address ?? '', property_city: s.property_city ?? '',
      property_sqm: s.property_sqm?.toString() ?? '', asking_price: s.asking_price?.toString() ?? '',
      reminder_enabled: s.reminder_enabled, reminder_interval_days: s.reminder_interval_days?.toString() ?? '7',
      notes: s.notes ?? '', status: s.status,
    });
    setEditingId(s.id); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const interval = parseInt(form.reminder_interval_days) || 7;
    const nextReminder = form.reminder_enabled ? new Date(Date.now() + interval * 86400000).toISOString() : null;

    const payload = {
      first_name: form.first_name, last_name: form.last_name,
      phone: form.phone || null, email: form.email || null,
      property_type: form.property_type || null,
      property_address: form.property_address || null, property_city: form.property_city || null,
      property_sqm: form.property_sqm ? parseFloat(form.property_sqm) : null,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      notes: form.notes || null, status: form.status,
      reminder_enabled: form.reminder_enabled,
      reminder_interval_days: form.reminder_enabled ? interval : null,
      next_reminder_date: nextReminder,
    };

    if (editingId) {
      await supabase.from('sellers').update(payload).eq('id', editingId);
    } else {
      const { data: inserted } = await supabase.from('sellers').insert(payload).select('*').single();
      if (inserted && form.reminder_enabled) {
        await createReminderAppointment(inserted, interval);
      }
    }

    setSaving(false); setShowForm(false); loadSellers();
  }

  async function createReminderAppointment(seller: Seller, days: number) {
    const remindDate = new Date(Date.now() + days * 86400000);
    remindDate.setHours(10, 0, 0, 0);
    await supabase.from('appointments').insert({
      title: `Chiamata di follow-up — ${seller.first_name} ${seller.last_name}`,
      date: remindDate.toISOString(),
      duration_minutes: 15,
      location: 'Telefono',
      notes: `Promemoria automatico per contattare ${seller.first_name} ${seller.last_name} (${seller.phone ?? 'nessun telefono'}). Interessato a vendere: ${seller.property_type ?? 'immobile'} a ${seller.property_address ?? ''} ${seller.property_city ?? ''}.`,
      status: 'programmato',
    });
  }

  async function handleMarkContacted(s: Seller) {
    const newInterval = s.reminder_interval_days ?? 7;
    const nextReminder = s.reminder_enabled ? new Date(Date.now() + newInterval * 86400000).toISOString() : null;
    await supabase.from('sellers').update({
      last_contacted_at: new Date().toISOString(),
      next_reminder_date: nextReminder,
      status: 'contattato',
    }).eq('id', s.id);
    loadSellers();
  }

  async function handleToggleReminder(s: Seller) {
    const newEnabled = !s.reminder_enabled;
    const interval = s.reminder_interval_days ?? 7;
    const nextReminder = newEnabled ? new Date(Date.now() + interval * 86400000).toISOString() : null;
    await supabase.from('sellers').update({
      reminder_enabled: newEnabled,
      next_reminder_date: nextReminder,
      reminder_interval_days: newEnabled ? interval : null,
    }).eq('id', s.id);
    loadSellers();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo venditore?')) return;
    await supabase.from('sellers').delete().eq('id', id);
    loadSellers();
  }

  const filtered = sellers.filter((s) => {
    const ms = !search || `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? '').includes(search) || (s.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.property_city ?? '').toLowerCase().includes(search.toLowerCase());
    return ms && (!filterStatus || s.status === filterStatus) &&
      (!filterType || s.property_type === filterType) &&
      (!filterReminder || (filterReminder === 'active' ? s.reminder_enabled : !s.reminder_enabled));
  });

  const overdueCount = sellers.filter((s) => s.reminder_enabled && isOverdue(s.next_reminder_date)).length;

  const inputClass = 'w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all';
  const labelClass = 'block text-[13px] font-medium text-[#1d1d1f] mb-1.5';

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Venditori</h1>
          <p className="text-[#86868b] text-[15px] mt-1">Persone interessate a vendere immobili</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2.5 rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition-all">
          <Plus className="w-[18px] h-[18px]" strokeWidth={2} /> Nuovo venditore
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="bg-[#fff2f0] border border-[#ffd0cc] rounded-2xl px-5 py-4 mb-5 flex items-center gap-3 animate-fade-in">
          <div className="w-9 h-9 bg-[#ff3b30]/10 rounded-[10px] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#ff3b30]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-medium text-[15px] text-[#1d1d1f]">{overdueCount} {overdueCount === 1 ? 'venditore da contattare' : 'venditori da contattare'}</p>
            <p className="text-[13px] text-[#86868b]">Hai promemoria scaduti. Chiamali per un aggiornamento.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
          <input type="text" placeholder="Cerca per nome, telefono, città..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all" />
        </div>
        <select value={filterReminder} onChange={(e) => setFilterReminder(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti i promemoria</option>
          <option value="active">Con promemoria</option>
          <option value="inactive">Senza promemoria</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti i tipi</option>
          {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti gli stati</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#86868b] py-12">
          <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /> Caricamento...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e7] p-16 text-center">
          <div className="w-14 h-14 bg-[#f5f5f7] rounded-[16px] flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-[#86868b]" strokeWidth={1.5} />
          </div>
          <p className="text-[#1d1d1f] font-medium text-[15px]">Nessun venditore trovato</p>
          <p className="text-[#86868b] text-[14px] mt-1">Aggiungi persone interessate a vendere</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s) => {
            const overdue = s.reminder_enabled && isOverdue(s.next_reminder_date);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-[#e5e5e7] p-5 hover:shadow-sm hover:border-[#d1d1d6] transition-all">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[16px] text-[#1d1d1f] truncate">{s.first_name} {s.last_name}</h3>
                        {s.phone && <p className="text-[13px] text-[#86868b] flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5" strokeWidth={1.5} /> {s.phone}</p>}
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[s.status] ?? statusColors.da_contattare}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#6e6e73] mb-2">
                      {s.property_type && <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" strokeWidth={1.5} /> {s.property_type}</span>}
                      {s.property_sqm != null && <span>{s.property_sqm} mq</span>}
                      {s.asking_price != null && <span className="font-medium text-[#1d1d1f]">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(s.asking_price)}
                      </span>}
                      {s.property_address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} /> {s.property_address}{s.property_city ? `, ${s.property_city}` : ''}</span>}
                    </div>

                    {s.notes && <p className="text-[13px] text-[#86868b] mb-2 line-clamp-1">{s.notes}</p>}

                    {/* Reminder badge */}
                    {s.reminder_enabled && s.next_reminder_date && (
                      <div className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${
                        overdue ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : 'bg-[#ff9500]/10 text-[#cc7a00]'
                      }`}>
                        <Bell className="w-3.5 h-3.5" strokeWidth={2} />
                        {overdue ? 'Da contattare: ' : 'Prossima chiamata: '}
                        {formatDate(s.next_reminder_date)}
                        <span className="text-[#86868b] font-normal">· ogni {s.reminder_interval_days} giorni</span>
                      </div>
                    )}
                    {s.last_contacted_at && (
                      <p className="text-[12px] text-[#86868b] mt-1.5">
                        Ultimo contatto: {new Date(s.last_contacted_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button onClick={() => handleMarkContacted(s)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#34c759]/10 text-[#248a3d] rounded-[10px] text-[13px] font-medium hover:bg-[#34c759]/20 transition">
                      <Check className="w-4 h-4" strokeWidth={2} /> Contattato
                    </button>
                    <button onClick={() => handleToggleReminder(s)}
                      className={`p-2 rounded-[10px] transition ${s.reminder_enabled ? 'text-[#ff9500] hover:bg-[#ff9500]/10' : 'text-[#86868b] hover:bg-[#f5f5f7]'}`}
                      title={s.reminder_enabled ? 'Disattiva promemoria' : 'Attiva promemoria'}>
                      {s.reminder_enabled ? <Bell className="w-4 h-4" strokeWidth={2} /> : <BellOff className="w-4 h-4" strokeWidth={2} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-2 rounded-[10px] text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] transition">
                      <Edit2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-[10px] text-[#86868b] hover:text-[#ff3b30] hover:bg-[#fff2f0] transition">
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] my-8 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-semibold text-[18px] text-[#1d1d1f]">{editingId ? 'Modifica venditore' : 'Nuovo venditore'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#86868b] hover:text-[#1d1d1f] transition"><X className="w-5 h-5" strokeWidth={1.5} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Nome *</label><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Cognome *</label><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Telefono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
              </div>

              <div className="border-t border-[#e5e5e7] pt-5">
                <p className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Immobile da vendere</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Tipo immobile</label>
                    <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className={inputClass}>
                      <option value="">— Seleziona —</option>
                      {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div><label className={labelClass}>Metri quadrati</label>
                    <input type="number" min="0" value={form.property_sqm} onChange={(e) => setForm({ ...form, property_sqm: e.target.value })} className={inputClass} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div><label className={labelClass}>Indirizzo</label><input value={form.property_address} onChange={(e) => setForm({ ...form, property_address: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Città</label><input value={form.property_city} onChange={(e) => setForm({ ...form, property_city: e.target.value })} className={inputClass} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div><label className={labelClass}>Prezzo richiesto (€)</label><input type="number" min="0" value={form.asking_price} onChange={(e) => setForm({ ...form, asking_price: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Stato</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                      {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select></div>
                </div>
              </div>

              <div className="border-t border-[#e5e5e7] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                      <Bell className="w-[18px] h-[18px] text-[#ff9500]" strokeWidth={1.5} />
                      Promemoria automatico
                    </p>
                    <p className="text-[13px] text-[#86868b] mt-0.5">Crea un evento in Appuntamenti per ricordarti di chiamare</p>
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, reminder_enabled: !form.reminder_enabled })}
                    className={`relative w-[44px] h-[26px] rounded-full transition ${form.reminder_enabled ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}>
                    <span className={`absolute top-[2px] w-[22px] h-[22px] bg-white rounded-full shadow transition-all ${form.reminder_enabled ? 'left-[20px]' : 'left-[2px]'}`} />
                  </button>
                </div>
                {form.reminder_enabled && (
                  <div className="animate-fade-in">
                    <label className={labelClass}>Ogni quanti giorni chiamare?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {intervalOptions.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setForm({ ...form, reminder_interval_days: String(opt.value) })}
                          className={`py-2.5 rounded-[10px] text-[13px] font-medium transition ${form.reminder_interval_days === String(opt.value) ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'}`}>
                          {opt.value} gg
                        </button>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#86868b] mt-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Verrà creato un appuntamento per il {new Date(Date.now() + (parseInt(form.reminder_interval_days) || 7) * 86400000).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                )}
              </div>

              <div><label className={labelClass}>Note</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} /></div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-[#f5f5f7] rounded-[10px] font-medium text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition">Annulla</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#0071e3] text-white rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition disabled:opacity-40">{saving ? 'Salvataggio...' : 'Salva'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
