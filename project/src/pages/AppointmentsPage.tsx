import { useEffect, useState } from 'react';
import { supabase, type Appointment, type Client, type Property } from '@/lib/supabase';
import { Plus, Edit2, Trash2, X, CalendarDays, Clock, MapPin, User as UserIcon, Home } from 'lucide-react';

const statusOptions = ['programmato', 'completato', 'cancellato'];

type ApptForm = {
  title: string; client_id: string; property_id: string;
  date: string; time: string; duration_minutes: string;
  location: string; notes: string; status: string;
};

const emptyForm: ApptForm = {
  title: '', client_id: '', property_id: '', date: '', time: '',
  duration_minutes: '60', location: '', notes: '', status: 'programmato',
};

const statusColors: Record<string, string> = {
  programmato: 'bg-[#ff9500]/10 text-[#cc7a00]',
  completato: 'bg-[#34c759]/10 text-[#248a3d]',
  cancellato: 'bg-[#ff3b30]/10 text-[#d70015]',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApptForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [a, c, p] = await Promise.all([
      supabase.from('appointments').select('*').order('date', { ascending: true }),
      supabase.from('clients').select('*').order('first_name'),
      supabase.from('properties').select('*').order('title'),
    ]);
    setAppointments(a.data ?? []); setClients(c.data ?? []); setProperties(p.data ?? []);
    setLoading(false);
  }

  function openCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true); }

  function openEdit(appt: Appointment) {
    const d = new Date(appt.date);
    setForm({
      title: appt.title, client_id: appt.client_id ?? '', property_id: appt.property_id ?? '',
      date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5),
      duration_minutes: appt.duration_minutes?.toString() ?? '60',
      location: appt.location ?? '', notes: appt.notes ?? '', status: appt.status,
    });
    setEditingId(appt.id); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const dateISO = new Date(`${form.date}T${form.time || '09:00'}`).toISOString();
    const payload = {
      title: form.title, client_id: form.client_id || null, property_id: form.property_id || null,
      date: dateISO, duration_minutes: parseInt(form.duration_minutes) || 60,
      location: form.location || null, notes: form.notes || null, status: form.status,
    };
    if (editingId) await supabase.from('appointments').update(payload).eq('id', editingId);
    else await supabase.from('appointments').insert(payload);
    setSaving(false); setShowForm(false); loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo appuntamento?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    loadAll();
  }

  const filtered = appointments.filter((a) => !filterStatus || a.status === filterStatus);

  function clientName(id: string | null) { if (!id) return null; const c = clients.find((x) => x.id === id); return c ? `${c.first_name} ${c.last_name}` : null; }
  function propTitle(id: string | null) { if (!id) return null; return properties.find((x) => x.id === id)?.title ?? null; }

  const inputClass = 'w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all';
  const labelClass = 'block text-[13px] font-medium text-[#1d1d1f] mb-1.5';

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Appuntamenti</h1>
          <p className="text-[#86868b] text-[15px] mt-1">Gestisci i tuoi appuntamenti</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2.5 rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition-all">
          <Plus className="w-[18px] h-[18px]" strokeWidth={2} /> Nuovo appuntamento
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#e5e5e7] rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti gli stati</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#86868b] py-12">
          <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /> Caricamento...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e7] p-16 text-center">
          <div className="w-14 h-14 bg-[#f5f5f7] rounded-[16px] flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-[#86868b]" strokeWidth={1.5} />
          </div>
          <p className="text-[#1d1d1f] font-medium text-[15px]">Nessun appuntamento trovato</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => {
            const cn = clientName(a.client_id);
            const pt = propTitle(a.property_id);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e5e5e7] p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:shadow-sm hover:border-[#d1d1d6] transition-all">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center w-[52px] h-[52px] bg-[#f5f5f7] rounded-[12px] shrink-0">
                    <span className="text-[10px] text-[#86868b] capitalize">{new Date(a.date).toLocaleDateString('it-IT', { month: 'short' })}</span>
                    <span className="text-[20px] font-semibold text-[#1d1d1f] leading-none">{new Date(a.date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] text-[#1d1d1f] truncate">{a.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#86868b] mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {new Date(a.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                      {a.duration_minutes && <span>{a.duration_minutes} min</span>}
                      {cn && <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> {cn}</span>}
                      {pt && <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" strokeWidth={1.5} /> {pt}</span>}
                      {a.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} /> {a.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[a.status] ?? statusColors.programmato}`}>{a.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(a)} className="text-[#86868b] hover:text-[#0071e3] transition"><Edit2 className="w-4 h-4" strokeWidth={2} /></button>
                    <button onClick={() => handleDelete(a.id)} className="text-[#86868b] hover:text-[#ff3b30] transition"><Trash2 className="w-4 h-4" strokeWidth={2} /></button>
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
              <h2 className="font-semibold text-[18px] text-[#1d1d1f]">{editingId ? 'Modifica appuntamento' : 'Nuovo appuntamento'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#86868b] hover:text-[#1d1d1f] transition"><X className="w-5 h-5" strokeWidth={1.5} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div><label className={labelClass}>Titolo *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Visita appartamento centro" className={inputClass} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Cliente</label>
                  <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className={inputClass}>
                    <option value="">— Nessuno —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select></div>
                <div><label className={labelClass}>Immobile</label>
                  <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} className={inputClass}>
                    <option value="">— Nessuno —</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className={labelClass}>Data *</label><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Ora *</label><input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Durata (min)</label><input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Luogo</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Presso l'immobile" className={inputClass} /></div>
                <div><label className={labelClass}>Stato</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
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
