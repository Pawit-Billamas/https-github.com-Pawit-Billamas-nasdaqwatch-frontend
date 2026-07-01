import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Newspaper, FileText } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <NavLink
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <span style={{ fontSize: '1.4rem' }}>📈</span>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            NasdaqWatch
          </span>
        </NavLink>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <NavLinkItem to="/" icon={<BarChart2 size={16} />} label="Dashboard" end />
          <NavLinkItem to="/stock" icon={<Newspaper size={16} />} label="ข่าวหุ้น" />
          <NavLinkItem to="/weekly-report" icon={<FileText size={16} />} label="รายงานสัปดาห์" />
        </div>
      </div>
    </nav>
  );
};

interface NavLinkItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ to, icon, label, end }) => {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.45rem 0.9rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        color: isActive ? '#818cf8' : '#94a3b8',
        border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
        boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
};

export default Navbar;
