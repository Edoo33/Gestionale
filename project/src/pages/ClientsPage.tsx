import { useEffect, useState } from 'react';
import { supabase, type Client, type Property } from '@/lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Users } from 'lucide-react';

const propertyTypes = [
  'monolocale', 'bilocale', 'trilocale', 'quadrilocale', 'appartamento',
  'villa', 'casa_indipendente', 'loft', 'attico', 'rustico', 'hotel', 'capannone',
  'negozio', 'ufficio', 'terreno',
];
const statusOptions = ['attivo', 'in_trattativa', 'concluso', 'non_interessato'];

type ClientForm = {
  first_name: string; last_name: string; phone: string; email: string;
  occupants: string; min_sqm: string; max_sqm: string;
  budget_min: string; budget_max: string;
  interested_property_type: string; interested_property_id: string;
  notes: string; status: string;
};

const emptyForm: ClientForm = {
  first_name: '', last_name: '', phone: '', email: '', occupants: '1',
  min_sqm: '', max_sqm: '', budget_min: '', budget_max: '',
  interested_property_type: '', interested_property_id: '', notes: '', status: 'attivo',
};

const statusColors: Record<string, string> = {
  attivo: 'bg-[#34c759]/10 text-[#248a3d]',
  in_trattativa: 'bg-[#ff9500]/10 text-[#cc7a00]',
  concluso: 'bg-[#0071e3]/10 text-[#0058b0]',
  non_interessato: 'bg-[#86868b]/10 text-[#6e6e73]',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadClients();
    supabase.from('properties').select('*').order('title').then(({ data }) => setProperties(data ?? []));
  }, []);

  async function loadClients() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }

  function openCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true); }

  function openEdit(c: Client) {
    setForm({
      first_name: c.first_name, last_name: c.last_name, phone: c.phone ?? '', email: c.email ?? '',
      occupants: String(c.occupants ?? 1), min_sqm: c.min_sqm?.toString() ?? '', max_sqm: c.max_sqm?.toString() ?? '',
      budget_min: c.budget_min?.toString() ?? '', budget_max: c.budget_max?.toString() ?? '',
      interested_property_type: c.interested_property_type ?? '', interested_property_id: c.interested_property_id ?? '',
      notes: c.notes ?? '', status: c.status,
    });
    setEditingId(c.id); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      first_name: form.first_name, last_name: form.last_name,
      phone: form.phone || null, email: form.email || null,
      occupants: parseInt(form.occupants) || 1,
      min_sqm: form.min_sqm ? parseFloat(form.min_sqm) : null,
      max_sqm: form.max_sqm ? parseFloat(form.max_sqm) : null,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      interested_property_type: form.interested_property_type || null,
      interested_property_id: form.interested_property_id || null,
      notes: form.notes || null, status: form.status,
    };
    if (editingId) await supabase.from('clients').update(payload).eq('id', editingId);
    else await supabase.from('clients').insert(payload);
    setSaving(false); setShowForm(false); loadClients();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo cliente?')) return;
    await supabase.from('clients').delete().eq('id', id);
    loadClients();
  }

  const filtered = clients.filter((c) => {
    const ms = !search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search) || (c.email ?? '').toLowerCase().includes(search.toLowerCase());
    return ms && (!filterStatus || c.status === filterStatus) && (!filterType || c.interested_property_type === filterType);
  });

  const inputClass = 'w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all';
  const labelClass = 'block text-[13px] font-medium text-[#1d1d1f] mb-1.5';

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Clienti</h1>
          <p className="text-[#86868b] text-[15px] mt-1">Gestisci l'anagrafica dei tuoi clienti</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2.5 rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition-all">
          <Plus className="w-[18px] h-[18px]" strokeWidth={2} /> Nuovo cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
          <input type="text" placeholder="Cerca per nome, telefono, email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti gli stati</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti i tipi</option>
          {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#86868b] py-12">
          <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /> Caricamento...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5e7] p-16 text-center">
          <div className="w-14 h-14 bg-[#f5f5f7] rounded-[16px] flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-[#86868b]" strokeWidth={1.5} />
          </div>
          <p className="text-[#1d1d1f] font-medium text-[15px]">Nessun cliente trovato</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e7] overflow-hidden">
          <table className="hidden md:table w-full">
            <thead>
              <tr className="border-b border-[#e5e5e7]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Contatti</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Persone</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Mq</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Interessato a</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Stato</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {filtered.map((c) => {
                const prop = properties.find((p) => p.id === c.interested_property_id);
                return (
                  <tr key={c.id} className="hover:bg-[#f5f5f7]/50 transition">
                    <td className="px-5 py-3.5"><p className="font-medium text-[14px] text-[#1d1d1f]">{c.first_name} {c.last_name}</p></td>
                    <td className="px-5 py-3.5"><p className="text-[14px] text-[#1d1d1f]">{c.phone ?? '—'}</p><p className="text-[13px] text-[#86868b]">{c.email ?? ''}</p></td>
                    <td className="px-5 py-3.5 text-[14px] text-[#6e6e73]">{c.occupants ?? '—'}</td>
                    <td className="px-5 py-3.5 text-[14px] text-[#6e6e73]">{c.min_sqm || c.max_sqm ? `${c.min_sqm ?? '—'}–${c.max_sqm ?? '—'} mq` : '—'}</td>
                    <td className="px-5 py-3.5 text-[14px] text-[#6e6e73]">{prop ? prop.title : (c.interested_property_type ?? '—')}</td>
                    <td className="px-5 py-3.5"><span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] ?? statusColors.non_interessato}`}>{c.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(c)} className="text-[#86868b] hover:text-[#0071e3] mr-3 transition"><Edit2 className="w-4 h-4 inline" strokeWidth={2} /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-[#86868b] hover:text-[#ff3b30] transition"><Trash2 className="w-4 h-4 inline" strokeWidth={2} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="md:hidden divide-y divide-[#f5f5f7]">
            {filtered.map((c) => {
              const prop = properties.find((p) => p.id === c.interested_property_id);
              return (
                <div key={c.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-[15px] text-[#1d1d1f]">{c.first_name} {c.last_name}</p>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] ?? statusColors.non_interessato}`}>{c.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[14px] text-[#6e6e73]">{c.phone ?? 'Nessun telefono'}</p>
                  <p className="text-[14px] text-[#6e6e73]">{c.occupants} persone · {c.min_sqm ?? '—'}–{c.max_sqm ?? '—'} mq</p>
                  <p className="text-[14px] text-[#6e6e73]">Interessato a: {prop ? prop.title : (c.interested_property_type ?? '—')}</p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => openEdit(c)} className="text-[#0071e3] hover:text-[#0058b0] text-[14px] font-medium flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" strokeWidth={2} /> Modifica</button>
                    <button onClick={() => handleDelete(c.id)} className="text-[#ff3b30] hover:text-[#d70015] text-[14px] font-medium flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Elimina</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] my-8 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-semibold text-[18px] text-[#1d1d1f]">{editingId ? 'Modifica cliente' : 'Nuovo cliente'}</h2>
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
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className={labelClass}>In quanti vanno a vivere</label><input type="number" min="1" value={form.occupants} onChange={(e) => setForm({ ...form, occupants: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Mq minimi</label><input type="number" min="0" value={form.min_sqm} onChange={(e) => setForm({ ...form, min_sqm: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Mq massimi</label><input type="number" min="0" value={form.max_sqm} onChange={(e) => setForm({ ...form, max_sqm: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Budget minimo (€)</label><input type="number" min="0" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Budget massimo (€)</label><input type="number" min="0" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Tipo di casa interessato</label>
                  <select value={form.interested_property_type} onChange={(e) => setForm({ ...form, interested_property_type: e.target.value })} className={inputClass}>
                    <option value="">— Seleziona —</option>
                    {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className={labelClass}>Annuncio specifico</label>
                  <select value={form.interested_property_id} onChange={(e) => setForm({ ...form, interested_property_id: e.target.value })} className={inputClass}>
                    <option value="">— Nessuno specifico —</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.city ?? ''})</option>)}
                  </select></div>
              </div>
              <div><label className={labelClass}>Stato</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select></div>
              <div><label className={labelClass}>Note</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} /></div>
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
