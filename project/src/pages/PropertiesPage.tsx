import { useEffect, useState } from 'react';
import { supabase, type Property } from '@/lib/supabase';
import {
  Plus, Edit2, Trash2, X, Home, MapPin, Maximize, BedDouble, Bath, Search,
} from 'lucide-react';

const propertyTypes = [
  'monolocale', 'bilocale', 'trilocale', 'quadrilocale', 'appartamento',
  'villa', 'casa_indipendente', 'loft', 'attico', 'rustico', 'hotel', 'capannone',
  'negozio', 'ufficio', 'terreno',
];
const statusOptions = ['disponibile', 'riservato', 'venduto', 'affittato'];
const listingTypes = ['vendita', 'affitto'];

type PropertyForm = {
  title: string;
  property_type: string;
  listing_type: string;
  address: string;
  city: string;
  sqm: string;
  rooms: string;
  bathrooms: string;
  price: string;
  monthly_price: string;
  status: string;
  description: string;
};

const emptyForm: PropertyForm = {
  title: '',
  property_type: 'appartamento',
  listing_type: 'vendita',
  address: '',
  city: '',
  sqm: '',
  rooms: '',
  bathrooms: '1',
  price: '',
  monthly_price: '',
  status: 'disponibile',
  description: '',
};

function formatPrice(price: number | null) {
  if (!price) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterListing, setFilterListing] = useState('');

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    setLoading(true);
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    setProperties(data ?? []);
    setLoading(false);
  }

  function openCreate() { setForm(emptyForm); setEditingId(null); setShowForm(true); }

  function openEdit(p: Property) {
    setForm({
      title: p.title, property_type: p.property_type, listing_type: p.listing_type ?? 'vendita',
      address: p.address ?? '', city: p.city ?? '',
      sqm: p.sqm?.toString() ?? '', rooms: p.rooms?.toString() ?? '', bathrooms: p.bathrooms?.toString() ?? '1',
      price: p.price?.toString() ?? '', monthly_price: p.monthly_price?.toString() ?? '',
      status: p.status, description: p.description ?? '',
    });
    setEditingId(p.id); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title, property_type: form.property_type, listing_type: form.listing_type,
      address: form.address || null, city: form.city || null,
      sqm: form.sqm ? parseFloat(form.sqm) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      bathrooms: parseInt(form.bathrooms) || 1,
      price: form.listing_type === 'vendita' ? (form.price ? parseFloat(form.price) : null) : null,
      monthly_price: form.listing_type === 'affitto' ? (form.monthly_price ? parseFloat(form.monthly_price) : null) : null,
      status: form.status, description: form.description || null,
    };
    if (editingId) await supabase.from('properties').update(payload).eq('id', editingId);
    else await supabase.from('properties').insert(payload);
    setSaving(false); setShowForm(false); loadProperties();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo immobile?')) return;
    await supabase.from('properties').delete().eq('id', id);
    loadProperties();
  }

  const filtered = properties.filter((p) => {
    const ms = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? '').toLowerCase().includes(search.toLowerCase());
    return ms && (!filterStatus || p.status === filterStatus) &&
      (!filterType || p.property_type === filterType) &&
      (!filterListing || p.listing_type === filterListing);
  });

  const inputClass = 'w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all';
  const labelClass = 'block text-[13px] font-medium text-[#1d1d1f] mb-1.5';

  const statusColors: Record<string, string> = {
    disponibile: 'bg-[#34c759]/10 text-[#248a3d]',
    riservato: 'bg-[#ff9500]/10 text-[#cc7a00]',
    venduto: 'bg-[#ff3b30]/10 text-[#d70015]',
    affittato: 'bg-[#0071e3]/10 text-[#0058b0]',
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Immobili</h1>
          <p className="text-[#86868b] text-[15px] mt-1">I tuoi annunci e proprietà</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2.5 rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition-all">
          <Plus className="w-[18px] h-[18px]" strokeWidth={2} /> Nuovo immobile
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
          <input type="text" placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[15px] text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all" />
        </div>
        <select value={filterListing} onChange={(e) => setFilterListing(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti</option>
          {listingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
          <option value="">Tutti i tipi</option>
          {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-[#f5f5f7] border border-transparent rounded-[10px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition">
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
            <Home className="w-7 h-7 text-[#86868b]" strokeWidth={1.5} />
          </div>
          <p className="text-[#1d1d1f] font-medium text-[15px]">Nessun immobile trovato</p>
          <p className="text-[#86868b] text-[14px] mt-1">Crea il tuo primo annuncio</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#e5e5e7] overflow-hidden hover:shadow-md hover:border-[#d1d1d6] transition-all group">
              <div className="h-36 bg-gradient-to-b from-[#f5f5f7] to-[#e8e8ed] flex items-center justify-center relative">
                <Home className="w-10 h-10 text-[#aeaeb2]" strokeWidth={1} />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${p.listing_type === 'affitto' ? 'bg-[#0071e3] text-white' : 'bg-[#1d1d1f] text-white'}`}>
                    {p.listing_type}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[p.status] ?? statusColors.disponibile}`}>
                    {p.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2">
                  <h3 className="font-semibold text-[16px] text-[#1d1d1f] leading-snug">{p.title}</h3>
                  <p className="text-[12px] text-[#86868b] capitalize mt-0.5">{p.property_type}</p>
                </div>
                {p.price != null && p.listing_type === 'vendita' && (
                  <p className="text-[20px] font-semibold text-[#1d1d1f] mb-3">{formatPrice(p.price)}</p>
                )}
                {p.monthly_price != null && p.listing_type === 'affitto' && (
                  <p className="text-[20px] font-semibold text-[#1d1d1f] mb-3">{formatPrice(p.monthly_price)}<span className="text-[13px] font-normal text-[#86868b]">/mese</span></p>
                )}
                {(!p.price && !p.monthly_price) && <p className="text-[16px] text-[#86868b] mb-3">Prezzo su richiesta</p>}
                {p.address && (
                  <p className="text-[13px] text-[#86868b] flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} /> {p.address}{p.city ? `, ${p.city}` : ''}
                  </p>
                )}
                <div className="flex gap-4 text-[13px] text-[#6e6e73] mb-4">
                  {p.sqm != null && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" strokeWidth={1.5} /> {p.sqm} mq</span>}
                  {p.rooms != null && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" strokeWidth={1.5} /> {p.rooms} locali</span>}
                  {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" strokeWidth={1.5} /> {p.bathrooms} bagni</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#f5f5f7] rounded-[10px] text-[13px] font-medium text-[#1d1d1f] hover:bg-[#e8e8ed] transition">
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2} /> Modifica
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="px-3 py-2 bg-[#f5f5f7] rounded-[10px] text-[#ff3b30] hover:bg-[#fff2f0] transition">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] my-8 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-semibold text-[18px] text-[#1d1d1f]">{editingId ? 'Modifica immobile' : 'Nuovo immobile'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#86868b] hover:text-[#1d1d1f] transition">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Titolo annuncio *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="es. Bilocale luminoso in centro" className={inputClass} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Tipo annuncio</label>
                  <div className="flex gap-1 bg-[#f5f5f7] rounded-[10px] p-1">
                    {listingTypes.map((t) => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, listing_type: t })}
                        className={`flex-1 py-2 rounded-[8px] text-[13px] font-medium capitalize transition ${form.listing_type === t ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tipo immobile</label>
                  <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className={inputClass}>
                    {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Stato</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>Indirizzo</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Città</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></div>
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div><label className={labelClass}>Metri q.</label>
                  <input type="number" min="0" value={form.sqm} onChange={(e) => setForm({ ...form, sqm: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Locali</label>
                  <input type="number" min="0" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>Bagni</label>
                  <input type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inputClass} /></div>
                {form.listing_type === 'vendita' ? (
                  <div><label className={labelClass}>Prezzo (€)</label>
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></div>
                ) : (
                  <div><label className={labelClass}>Prezzo/mese (€)</label>
                    <input type="number" min="0" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} className={inputClass} /></div>
                )}
              </div>

              <div>
                <label className={labelClass}>Descrizione</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-[#f5f5f7] rounded-[10px] font-medium text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition">
                  Annulla
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#0071e3] text-white rounded-[10px] font-medium text-[14px] hover:bg-[#0077ed] active:scale-[0.98] transition disabled:opacity-40">
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
