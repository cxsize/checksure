import { useState, useEffect } from 'react';
import type { Theme, Lang, SiteData } from '../tokens';
import { COPY, FONT_TH, FONT_NUM, MOCK_SITES, fmtTime, fmtDateTh } from '../tokens';
import { useNow } from '../hooks/useNow';
import { useGeolocation, evaluateSites } from '../hooks/useGeolocation';
import { BigButton } from '../components/ui/BigButton';
import { Icons } from '../components/ui/Icons';

interface ClockInScreenProps {
  theme: Theme;
  lang: Lang;
  mode: 'in' | 'out';
  onConfirm: (siteId: string) => void;
  onCancel: () => void;
}

export function ClockInScreen({ theme, lang, mode, onConfirm, onCancel }: ClockInScreenProps) {
  const now = useNow(60000);
  const geo = useGeolocation();
  const [sites, setSites] = useState<SiteData[]>(MOCK_SITES);
  const [selectedId, setSelectedId] = useState(MOCK_SITES[0].id);
  const [phase, setPhase] = useState<'locating' | 'ready'>('locating');

  useEffect(() => {
    geo.locate();
    // Fallback: show ready state after 2s when GPS succeeds or times out
    const t = setTimeout(() => setPhase('ready'), 2000);
    return () => clearTimeout(t);
  }, []);

  // If geo error occurs, still transition to ready so user sees the outside-area warning
  useEffect(() => {
    if (geo.error) setPhase('ready');
  }, [geo.error]);

  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      setSites(evaluateSites(geo.lat, geo.lng, MOCK_SITES));
      setPhase('ready');
    }
  }, [geo.lat, geo.lng]);

  const site = sites.find((s) => s.id === selectedId) ?? sites[0];
  const canConfirm = phase === 'ready' && site.inside;

  const confirmLabel = mode === 'in' ? COPY.confirmIn[lang] : COPY.confirmOut[lang];
  const sublabel = canConfirm
    ? (lang === 'en' ? `Tap to record ${fmtTime(now)}` : `แตะเพื่อบันทึก ${fmtTime(now)}`)
    : (lang === 'en' ? 'Move inside the geofence first' : 'เข้าไปในพื้นที่ก่อน');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg }}>
      {/* Top bar */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onCancel} style={{
          width: 44, height: 44, borderRadius: 22, border: `1px solid ${theme.line}`,
          background: theme.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icons.Chevron dir="left" size={22} c={theme.ink} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 18, fontWeight: 700, color: theme.ink }}>{confirmLabel}</div>
          <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft }}>{fmtTime(now)} · {fmtDateTh(now, lang)}</div>
        </div>
      </div>

      {/* Map mock */}
      <div style={{ margin: '12px 20px 16px', height: 240, borderRadius: 24, overflow: 'hidden', position: 'relative', background: theme.surface, border: `1px solid ${theme.line}` }}>
        <MapMock theme={theme} inside={site.inside} />

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', gap: 10,
          background: theme.card, borderRadius: 14, padding: '10px 14px',
          boxShadow: '0 4px 14px -4px rgba(0,0,0,0.12)',
        }}>
          {phase === 'locating' ? (
            <>
              <div style={{
                width: 18, height: 18, border: `2.5px solid ${theme.line}`, borderTopColor: theme.primary,
                borderRadius: '50%', animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{ fontFamily: FONT_TH, fontSize: 14, fontWeight: 600, color: theme.ink }}>
                {COPY.locating[lang]}
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: site.inside ? theme.accent : theme.warn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {site.inside ? <Icons.Check size={12} c="#fff" sw={3} /> : <Icons.X size={12} c="#fff" sw={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_TH, fontSize: 14, fontWeight: 700, color: theme.ink }}>
                  {site.inside ? COPY.inArea[lang] : COPY.outArea[lang]}
                </div>
              </div>
              <div style={{ fontFamily: FONT_NUM, fontSize: 13, fontWeight: 700, color: site.inside ? theme.accent : theme.warn, fontVariantNumeric: 'tabular-nums' }}>
                {site.distance < 1000 ? `${site.distance} ${COPY.meters[lang]}` : `${(site.distance / 1000).toFixed(1)} km`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Site picker */}
      <div style={{ padding: '0 20px 8px' }}>
        <div style={{ fontFamily: FONT_TH, fontSize: 13, color: theme.inkSoft, marginBottom: 10, fontWeight: 600, paddingLeft: 4 }}>
          {COPY.pickSite[lang]}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sites.map((s) => {
            const active = s.id === selectedId;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                width: '100%', border: `2px solid ${active ? theme.primary : theme.line}`,
                background: theme.card, borderRadius: 16,
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
                  border: `2px solid ${active ? theme.primary : theme.line}`,
                  background: active ? theme.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.primaryInk }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_TH, fontSize: 15, fontWeight: 700, color: theme.ink }}>{s.name[lang]}</div>
                  <div style={{ fontFamily: FONT_TH, fontSize: 12, color: theme.inkSoft, marginTop: 1 }}>{s.addr[lang]}</div>
                </div>
                <div style={{
                  fontFamily: FONT_NUM, fontSize: 12, fontWeight: 700,
                  color: s.inside ? theme.accent : theme.inkMute,
                  background: s.inside ? theme.accentSoft : theme.chipBg,
                  padding: '4px 9px', borderRadius: 999,
                }}>
                  {s.distance < 1000 ? `${s.distance} ${COPY.meters[lang]}` : `${(s.distance / 1000).toFixed(1)} km`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS permission denied */}
      {geo.error && (
        <div style={{ margin: '12px 20px 0', background: theme.warnSoft, color: theme.warn, borderRadius: 14, padding: '12px 14px', fontFamily: FONT_TH, fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 10 }}>
          <Icons.Pin size={18} c={theme.warn} />
          <div>
            <b>{lang === 'en' ? 'Location access denied.' : 'ไม่สามารถเข้าถึงตำแหน่งได้'}</b><br />
            {lang === 'en'
              ? 'Enable location in your browser settings, then reload.'
              : 'กรุณาเปิดสิทธิ์ตำแหน่งในเบราว์เซอร์แล้วโหลดหน้าใหม่'}
          </div>
        </div>
      )}

      {/* Outside warning */}
      {phase === 'ready' && !geo.error && !site.inside && (
        <div style={{ margin: '12px 20px 0', background: theme.warnSoft, color: theme.warn, borderRadius: 14, padding: '12px 14px', fontFamily: FONT_TH, fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 10 }}>
          <Icons.Pin size={18} c={theme.warn} />
          <div>
            <b>{lang === 'en' ? 'You are outside the site area.' : 'คุณอยู่นอกพื้นที่ทำงาน'}</b><br />
            {lang === 'en' ? 'Please move closer or pick the correct site.' : 'กรุณาเข้าใกล้พื้นที่หรือเลือกสถานที่ให้ถูกต้อง'}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Bottom action */}
      <div style={{ padding: '12px 20px 24px', background: theme.bg, borderTop: `1px solid ${theme.line}` }}>
        <BigButton
          theme={theme}
          label={confirmLabel}
          sublabel={sublabel}
          onClick={() => onConfirm(selectedId)}
          color={mode === 'out' ? theme.accent : theme.primary}
          inkColor="#fff"
          disabled={!canConfirm}
          icon={
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Check size={22} c="#fff" sw={3} />
            </div>
          }
        />
      </div>
    </div>
  );
}

function MapMock({ theme, inside }: { theme: Theme; inside: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.surface, overflow: 'hidden' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <defs>
          <pattern id="mapg" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke={theme.line} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapg)" />
        <path d="M -20 160 Q 120 100 320 180" fill="none" stroke={theme.line} strokeWidth="18" opacity="0.7" />
        <path d="M -20 160 Q 120 100 320 180" fill="none" stroke={theme.bg} strokeWidth="2" strokeDasharray="6 6" />
      </svg>

      {/* Geofence circle */}
      <div style={{
        position: 'absolute', left: '50%', top: '52%', width: 180, height: 180, borderRadius: '50%',
        transform: 'translate(-50%,-50%)',
        background: `${theme.accent}22`, border: `2px dashed ${theme.accent}`,
      }} />

      {/* Site pin */}
      <div style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-110%)' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50% 50% 50% 0', background: theme.accent,
          transform: 'rotate(-45deg)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ transform: 'rotate(45deg)' }}>
            <Icons.Pin size={16} c="#fff" sw={2.4} />
          </div>
        </div>
      </div>

      {/* User dot */}
      <div style={{
        position: 'absolute',
        left: inside ? '48%' : '80%',
        top: inside ? '58%' : '30%',
        transform: 'translate(-50%,-50%)',
      }}>
        <div style={{
          position: 'absolute', width: 40, height: 40, borderRadius: 20,
          background: `${theme.primary}33`, left: -20, top: -20,
          animation: 'pulse 1.8s ease-out infinite',
        }} />
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: theme.primary,
          border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}
