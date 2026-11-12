import React from 'react';
import markLogo from '../../assets/mark.jpg';

/**
 * Footer – Exact Figma "DataX Landing" Footer Spec
 * From Figma Inspector:
 *   - Layout: Horizontal, 1440px Fill × 113px Hug
 *   - Background: color/surface #FFFFFF
 *   - Border: 1px top side, color/border #E3E6EE
 *   - Padding: T40 R120 B40 L120
 *   - Gap: 32px between elements
 *   - Logo: Logo/Lockup light → "DataX" Geist 700 Bold 22px 100% lh -3% tracking, color #0A0F1F
 *   - "by DataGlow.ai": DX/small Geist 400 Regular 13px 150% lh, color/text3 #5F6678
 *   - Nav links: DX/small Geist 400 Regular 13px 150% lh, color/text2 #474F61 (hover → #2D55F5)
 *   - Copyright "© 2026 DataGlow.ai Inc.": DX/small Geist 400 13px 150% lh, color/text3 #5F6678
 */
const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Use cases',    href: '#use-cases' },
  { label: 'Security',     href: '#for-leaders' },
  { label: 'Privacy',      href: '#' },
  { label: 'Contact',      href: '#' },
];

const LINK_STYLE = {
  fontFamily: "'Geist', sans-serif",
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '150%',
  letterSpacing: '0%',
  color: '#474F61',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'color 0.15s',
};

export default function Footer({ setActiveView, onOpenDemo }) {
  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E3E6EE',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 73,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        {/* ── Logo Lockup: mark + "DataX · by DataGlow.ai" ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => { setActiveView('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <img
            src={markLogo}
            alt="DataX"
            style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', display: 'block' }}
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {/* "DataX" — Logo/Lockup light: Geist 700 Bold 22px 100% lh -3% tracking */}
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                lineHeight: '100%',
                letterSpacing: '-0.03em',
                color: '#0A0F1F',
              }}
            >
              DataX
            </span>
            {/* "by DataGlow.ai" — DX/small: Geist 400 Regular 13px 150% lh, color/text3 #5F6678 */}
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                fontWeight: 400,
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#5F6678',
              }}
            >
              by DataGlow.ai
            </span>
          </div>
        </div>

        {/* ── Center Nav Links ── */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            flex: 1,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={LINK_STYLE}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#2D55F5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#474F61')}
              onClick={(e) => {
                if (link.href.startsWith('#') && link.href.length > 1) {
                  e.preventDefault();
                  const el = document.getElementById(link.href.slice(1));
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ── Copyright — DX/small: Geist 400 13px 150% lh, color/text3 #5F6678 ── */}
        <span
          style={{
            fontFamily: "'Geist', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: '150%',
            letterSpacing: '0%',
            color: '#5F6678',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          © {new Date().getFullYear()} DataGlow.ai Inc.
        </span>
      </div>
    </footer>
  );
}
