import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import markLogo from '../../assets/mark.jpg';

/**
 * LandingNavbar – Exact Figma "DataX Landing · animated" spec
 *
 * Container:
 *   - Width: Fixed 1200px (max-w-[1200px] centered)
 *   - Height: Hug (71px)
 *   - Radius: 999px (full pill)
 *   - Border: 1px solid #FFFFFF 10%
 *   - Background: #161C30 at 72% opacity
 *   - Drop shadow: X 0, Y 12, Blur 32, Spread 0, color #0A0F1F 45%, backdrop blur
 *   - Padding: Top 10px, Right 10px, Bottom 10px, Left 22px, Gap 28px
 *   - Positioned: sticky top-0, centered, with 12px top margin (floating)
 *
 * Logo/Lockup dark:
 *   - Icon: mark.jpg 32×32px, radius 8px
 *   - Text: "DataX" Geist 700 Bold 22px, line-height 100%, letter-spacing -3%
 *   - Gap: 10px
 *
 * Nav links (NavLink/How it works):
 *   - Font: Geist 500 Medium, 13px, Line-height 145%, color #A8ADC2
 *
 * CTA/Book a demo:
 *   - Hug 156×47px, linear-gradient(#4069FF -> #294FED), radius 999px
 */
export default function LandingNavbar({ setActiveView, onOpenDemo }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = ['How it works', 'Use cases', 'For leaders', 'Security'];

  return (
    <>
      {/* Desktop / tablet navbar — floating pill */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 16px',
          pointerEvents: 'none',
          fontFamily: "'Geist', sans-serif",
        }}
      >
        <nav
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 1200,
            height: 71,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(22,28,48,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 12px 32px 0 rgba(10,15,31,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 22,
            gap: 28,
            boxSizing: 'border-box',
          }}
        >
          {/* ── Logo / Lockup dark ── Figma: 32×32 icon + DataX text ── */}
          <div
            onClick={() => { setActiveView('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              flexShrink: 0,
              height: 32,
            }}
          >
            {/* User provided mark.jpg logo */}
            <img
              src={markLogo}
              alt="DataX Mark"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                objectFit: 'contain',
                display: 'block',
                flexShrink: 0,
              }}
            />
            {/* DataX text — Figma: Geist 700 Bold, 22px, 100% leading, -3% tracking */}
            <span style={{
              fontFamily: "'Geist', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: '100%',
              userSelect: 'none',
            }}>
              DataX
            </span>
          </div>

          {/* ── Center Nav Links ─────────────────────────── */}
          <div
            className="hidden md:flex"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {links.map(label => (
              <button
                key={label}
                onClick={() => {
                  const map = {
                    'How it works': 'how-it-works',
                    'Use cases': 'use-cases',
                    'For leaders': 'for-leaders',
                    'Security': 'for-leaders',
                  };
                  const targetId = map[label];
                  if (targetId) {
                    const el = document.getElementById(targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: '145%',
                  letterSpacing: '0%',
                  color: '#A8ADC2',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#A8ADC2'}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Right: Sign in + CTA ─────────────────────── */}
          <div
            className="hidden sm:flex"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* Sign in */}
            <button
              onClick={() => setActiveView('poc')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: '145%',
                color: '#A8ADC2',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#A8ADC2'}
            >
              Sign in
            </button>

            {/* CTA/Book a demo — Figma: Hug 156×47px, gradient #4069FF -> #294FED */}
            <button
              onClick={onOpenDemo}
              style={{
                height: 47,
                padding: '12px 22px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.20)',
                background: 'linear-gradient(180deg, #4069FF 0%, #294FED 100%)',
                color: '#FFFFFF',
                fontFamily: "'Geist', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexShrink: 0,
                boxShadow: '0 4px 16px rgba(41,79,237,0.45)',
                transition: 'transform 0.1s, box-shadow 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.92';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(41,79,237,0.60)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(41,79,237,0.45)';
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Book a demo
              <ArrowRight size={15} />
            </button>
          </div>

          {/* ── Mobile hamburger ─────────────────────────── */}
          <button
            className="sm:hidden"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#A8ADC2', padding: 4, flexShrink: 0,
            }}
          >
            {mobileOpen ? <X size={20} color="#fff" /> : <Menu size={20} />}
          </button>
        </nav>

        {/* ── Mobile dropdown ──────────────────────────── */}
        {mobileOpen && (
          <div style={{
            position: 'absolute',
            top: 95,
            left: 16, right: 16,
            background: 'rgba(22,28,48,0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.10)',
            padding: '16px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 12px 32px rgba(10,15,31,0.60)',
            fontFamily: "'Geist', sans-serif",
          }}>
            {links.map(l => (
              <button key={l} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 15, fontWeight: 500,
                color: '#A8ADC2', padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }} onClick={() => setMobileOpen(false)}>{l}</button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button onClick={() => { setActiveView('poc'); setMobileOpen(false); }} style={{
                padding: 12, borderRadius: 12,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#E2E8F0', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>Sign in</button>
              <button onClick={() => { onOpenDemo(); setMobileOpen(false); }} style={{
                padding: 12, borderRadius: 12,
                background: 'linear-gradient(180deg, #4069FF 0%, #294FED 100%)', border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>Book a demo <ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
