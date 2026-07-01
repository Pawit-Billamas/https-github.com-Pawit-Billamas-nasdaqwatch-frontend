import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const labels = {
  en: {
    navMain: 'Overview', navResearch: 'Research',
    dashboard: 'Dashboard', portfolio: 'Portfolio', alerts: 'Alerts',
    discover: 'Discover', compare: 'Compare', insights: 'AI Insights', calendar: 'Calendar',
    member: 'Pro member',
  },
  th: {
    navMain: 'ภาพรวม', navResearch: 'วิจัย',
    dashboard: 'แดชบอร์ด', portfolio: 'พอร์ตโฟลิโอ', alerts: 'แจ้งเตือน',
    discover: 'ค้นหาหุ้น', compare: 'เปรียบเทียบ', insights: 'AI สรุปข่าว', calendar: 'ปฏิทิน',
    member: 'สมาชิก Pro',
  },
};

interface NavItem {
  to: string;
  key: keyof typeof labels.en;
  icon: React.ReactNode;
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const navItems: NavItem[] = [
  {
    to: '/', key: 'dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>,
  },
  {
    to: '/portfolio', key: 'portfolio',
    icon: <NavIcon path="M3 13.5 9 8l4 3.5L21 5M3 20h18M3 20v-6.5M21 20V9" />,
  },
  {
    to: '/alerts', key: 'alerts',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" /><path d="M13.5 20.5a2 2 0 0 1-3 0" /></svg>,
  },
];

const researchItems: NavItem[] = [
  {
    to: '/discover', key: 'discover',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7.5" /><line x1="21" y1="21" x2="16.7" y2="16.7" /></svg>,
  },
  {
    to: '/compare', key: 'compare',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="7" height="16" rx="2" /><rect x="14" y="4" width="7" height="16" rx="2" /></svg>,
  },
  {
    to: '/insights', key: 'insights',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>,
  },
  {
    to: '/calendar', key: 'calendar',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" /></svg>,
  },
];

const activeStyle: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
  padding: '9px 12px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5,
  color: 'var(--accent)', fontWeight: 600, textDecoration: 'none',
};
const inactiveStyle: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
  padding: '9px 12px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5,
  color: '#7a7360', fontWeight: 500, textDecoration: 'none',
};

export default function Sidebar() {
  const { lang } = useLang();
  const t = labels[lang];

  const renderNavItem = (item: NavItem, isEnd = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={isEnd}
      style={({ isActive }) => isActive ? activeStyle : inactiveStyle}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 11,
              background: 'var(--accent-soft)', zIndex: 0,
            }} />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>{item.icon}</span>
          <span style={{ position: 'relative', zIndex: 1 }}>{t[item.key]}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 8px 24px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 11, background: '#2945A8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(41,69,168,0.30)',
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,16 9,10 13,14 21,5" />
            <polyline points="15,5 21,5 21,11" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.02em', lineHeight: 1 }}>WitWatch</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', color: '#a7aab2', textTransform: 'uppercase', marginTop: 3 }}>NASDAQ · AI</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
        <div className="section-label">{t.navMain}</div>
        {navItems.map((item, i) => renderNavItem(item, i === 0))}

        <div className="section-label" style={{ marginTop: 8 }}>{t.navResearch}</div>
        {researchItems.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 2px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e7dcc4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13, color: '#5b6270',
          }}>W</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>WitWatch User</div>
            <div style={{ fontSize: 10.5, color: '#a7aab2' }}>{t.member}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
