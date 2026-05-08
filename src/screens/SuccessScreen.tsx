import type { Theme, Lang } from '../tokens';
import { COPY, FONT_TH } from '../tokens';
import { useSites } from '../hooks/useSites';
import { BigButton } from '../components/ui/BigButton';
import { BigTime } from '../components/ui/BigTime';
import { Icons } from '../components/ui/Icons';

interface SuccessScreenProps {
  theme: Theme;
  lang: Lang;
  mode: 'in' | 'out';
  time: string;
  siteId?: string;
  onDone: () => void;
}

export function SuccessScreen({ theme, lang, mode, time, siteId, onDone }: SuccessScreenProps) {
  const { sites } = useSites();
  const site = sites.find((s) => s.id === siteId) ?? sites[0] ?? null;
  const circleColor = mode === 'in' ? theme.accent : theme.primary;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg, padding: '40px 28px 32px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <div style={{
          width: 120, height: 120, borderRadius: 60,
          background: circleColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 20px 40px -12px ${circleColor}80`,
          animation: 'pop 0.4s cubic-bezier(.2,1.4,.4,1)',
        }}>
          <Icons.Check size={64} c="#fff" sw={3.2} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_TH, fontSize: 28, fontWeight: 800, color: theme.ink, marginBottom: 6 }}>
            {mode === 'in' ? COPY.successIn[lang] : COPY.successOut[lang]}
          </div>
          <BigTime value={time} theme={theme} size={56} />
          <div style={{ fontFamily: FONT_TH, fontSize: 14, color: theme.inkSoft, marginTop: 10 }}>
            {site ? site.name[lang] : ''}
          </div>
        </div>
      </div>

      <BigButton
        theme={theme}
        label={COPY.backHome[lang]}
        onClick={onDone}
        icon={
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Home size={20} c={theme.primaryInk} />
          </div>
        }
      />
    </div>
  );
}
