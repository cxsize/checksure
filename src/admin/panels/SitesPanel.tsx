import { useState, useEffect, useCallback } from 'react';
import { listSites, createSite, updateSite, deactivateSite, activateSite } from '../api';
import type { AdminSite } from '../api';

export function SitesPanel() {
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listSites();
      setSites(res.sites);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggleActive = async (site: AdminSite) => {
    try {
      if (site.active) {
        await deactivateSite(site.siteId);
      } else {
        await activateSite(site.siteId);
      }
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={s.title}>Sites</h2>
        <button onClick={() => setShowCreate(true)} style={s.primaryBtn}>+ Add Site</button>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {showCreate && (
        <CreateSiteForm
          onDone={() => { setShowCreate(false); refresh(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editId && (
        <EditSiteForm
          site={sites.find((st) => st.siteId === editId)!}
          onDone={() => { setEditId(null); refresh(); }}
          onCancel={() => setEditId(null)}
        />
      )}

      {loading ? (
        <div style={s.muted}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {sites.map((site) => (
            <div key={site.siteId} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{site.name.en}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{site.name.th}</div>
                </div>
                <span style={{
                  ...s.badge,
                  background: site.active ? '#d1fae5' : '#fee2e2',
                  color: site.active ? '#065f46' : '#991b1b',
                }}>
                  {site.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 10 }}>{site.addr.en}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                {site.lat.toFixed(5)}, {site.lng.toFixed(5)} · {site.radiusM}m radius
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => setEditId(site.siteId)} style={s.actionBtn}>Edit</button>
                <button onClick={() => handleToggleActive(site)} style={{ ...s.actionBtn, color: site.active ? '#dc2626' : '#059669' }}>
                  {site.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSiteForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [id, setId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [addrEn, setAddrEn] = useState('');
  const [addrTh, setAddrTh] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radiusM, setRadiusM] = useState('200');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createSite({
        id: id || undefined,
        name: { en: nameEn, th: nameTh },
        addr: { en: addrEn, th: addrTh },
        lat: Number(lat),
        lng: Number(lng),
        radiusM: Number(radiusM),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.formCard}>
      <h3 style={{ margin: '0 0 16px' }}>Create Site</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Site ID (optional, auto-generated)" value={id} onChange={(e) => setId(e.target.value)} style={s.input} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={s.input} required />
          <input placeholder="Name (TH)" value={nameTh} onChange={(e) => setNameTh(e.target.value)} style={s.input} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Address (EN)" value={addrEn} onChange={(e) => setAddrEn(e.target.value)} style={s.input} required />
          <input placeholder="Address (TH)" value={addrTh} onChange={(e) => setAddrTh(e.target.value)} style={s.input} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <input placeholder="Latitude" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} style={s.input} required />
          <input placeholder="Longitude" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} style={s.input} required />
          <input placeholder="Radius (m)" type="number" value={radiusM} onChange={(e) => setRadiusM(e.target.value)} style={s.input} required />
        </div>
        {error && <div style={s.error}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={s.primaryBtn}>{busy ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function EditSiteForm({ site, onDone, onCancel }: { site: AdminSite; onDone: () => void; onCancel: () => void }) {
  const [nameEn, setNameEn] = useState(site.name.en);
  const [nameTh, setNameTh] = useState(site.name.th);
  const [addrEn, setAddrEn] = useState(site.addr.en);
  const [addrTh, setAddrTh] = useState(site.addr.th);
  const [lat, setLat] = useState(String(site.lat));
  const [lng, setLng] = useState(String(site.lng));
  const [radiusM, setRadiusM] = useState(String(site.radiusM));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateSite(site.siteId, {
        name: { en: nameEn, th: nameTh },
        addr: { en: addrEn, th: addrTh },
        lat: Number(lat),
        lng: Number(lng),
        radiusM: Number(radiusM),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.formCard}>
      <h3 style={{ margin: '0 0 16px' }}>Edit Site: {site.siteId}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={s.input} required />
          <input placeholder="Name (TH)" value={nameTh} onChange={(e) => setNameTh(e.target.value)} style={s.input} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder="Address (EN)" value={addrEn} onChange={(e) => setAddrEn(e.target.value)} style={s.input} required />
          <input placeholder="Address (TH)" value={addrTh} onChange={(e) => setAddrTh(e.target.value)} style={s.input} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <input placeholder="Latitude" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} style={s.input} required />
          <input placeholder="Longitude" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} style={s.input} required />
          <input placeholder="Radius (m)" type="number" value={radiusM} onChange={(e) => setRadiusM(e.target.value)} style={s.input} required />
        </div>
        {error && <div style={s.error}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={s.primaryBtn}>{busy ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  primaryBtn: {
    padding: '10px 18px', background: '#E8734A', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 18px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  actionBtn: {
    background: 'transparent', border: 'none', color: '#E8734A',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
  },
  error: { color: '#dc2626', fontSize: 13 },
  muted: { color: '#9ca3af', fontSize: 14 },
  formCard: {
    background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
    border: '1px solid #e5e7eb', maxWidth: 560,
  },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
  },
};
