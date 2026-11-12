import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import DataStreamConveyor from './DataStreamConveyor';

/**
 * Hero – Exact Figma "DataX Landing · animated" spec
 *
 * Eyebrow Tag:
 *   - 212×21px hug, Radius 999px
 *   - Padding: T2 R8 B2 L8, Gap 5px
 *   - Background: #D4FF3A (color/volt)
 *   - Dot: true (filled circle, same #D4FF3A base → black dot)
 *   - Text: Geist 500 Medium 12px, color #0A0F1F (color/ink)
 *
 * Headline:
 *   - "Bad data stops here." — Geist SemiBold (600) 96px, tracking -4.5%, leading 96%
 *   - "Bad data " = white (#FFFFFF)
 *   - "stops here." = #D4FF3A (volt yellow-green)
 *
 * Subtitle:
 *   - Geist 400 Regular 19px, line-height 155%, color #A6ADC2
 *   - Max-width 680px
 *
 * Buttons:
 *   - "Book a demo →" — Blue pill, Geist 500, same style as navbar CTA
 *   - "▷ See how it works" — Dark pill with border
 */
export default function Hero({ setActiveView, onOpenDemo }) {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 120,         // space for the 71px floating navbar + 20px gap + 29px buffer
        paddingBottom: 40,
        overflow: 'hidden',
        /* Figma: linear-gradient(#171C45 0%, #0A0F1F 45%, #0A0F1F 100%) */
        background: 'linear-gradient(180deg, #171C45 0%, #0A0F1F 45%, #0A0F1F 100%)',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      {/* Top ambient glow/shed beside & behind the floating navbar (Figma: illuminated shed) */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 1400, height: 260,
        background: 'radial-gradient(ellipse 75% 100% at 50% 0%, rgba(64,105,255,0.42) 0%, rgba(23,28,69,0.30) 50%, transparent 80%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(100,150,255,0.5) 50%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Background ambient glows */}
      <div style={{
        position: 'absolute', top: '22%', left: '50%',
        transform: 'translateX(-50%)',
        width: 720, height: 400,
        background: 'rgba(37,99,235,0.08)',
        filter: 'blur(140px)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '30%',
        width: 360, height: 360,
        background: 'rgba(6,182,212,0.04)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Subtle dot-grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.25) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* ── Main content ───────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* ── Eyebrow pill ── Figma: Tag, tone=volt, dot=true ── */}
        {/*
          Width: Hug 212px, Height: Hug 21px, Radius 999px
          Padding: T2 R8 B2 L8, Gap 5px
          Background: #D4FF3A (volt)
          Label text: Geist 500 12px, color #0A0F1F
          Dot: filled circle #0A0F1F
          Uses .landing-volt-bg to bypass Zero-Neon CSS override
        */}
        <div
          className="landing-volt-bg"
          style={{
            marginBottom: 24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            paddingTop: 2, paddingBottom: 2,
            paddingLeft: 8, paddingRight: 8,
            borderRadius: 999,
            boxShadow: '0 0 14px rgba(212,255,58,0.30)',
          }}
        >
          {/* Dot */}
          <span style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: '#0A0F1F',
            flexShrink: 0,
          }} />
          {/* Label */}
          <span style={{
            fontFamily: "'Geist', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: '140%',
            letterSpacing: '0%',
            color: '#0A0F1F',
            whiteSpace: 'nowrap',
          }}>
            AI rule engine for enterprise data
          </span>
        </div>

        {/* ── Headline ────────────────────────────────────── */}
        {/*
          Font: Geist SemiBold (600), 96px, tracking -4.5%, leading 96%
          "Bad data " = white, "stops here." = #D4FF3A volt
          .landing-hero-h1 defeats global h1 Plus Jakarta Sans override
          .volt-span forces #D4FF3A bypassing Zero-Neon neutralization
        */}
        <h1
          className="landing-hero-h1"
          style={{
            margin: '0 0 28px 0',
            fontSize: 'clamp(48px, 7vw, 96px)',
            textAlign: 'center',
          }}
        >
          Bad data{' '}
          <span className="volt-span">stops here.</span>
        </h1>

        {/* ── Subtitle ─────────────────────────────────────── */}
        {/*
          Font: Geist Regular (400), 19px, line-height 155%, color #A6ADC2
          Max-width 680px
        */}
        <p style={{
          margin: '0 0 32px 0',
          fontFamily: "'Geist', sans-serif",
          fontSize: 19,
          fontWeight: 400,
          lineHeight: '155%',
          letterSpacing: '0%',
          textAlign: 'center',
          color: '#A6ADC2',
          maxWidth: 680,
        }}>
          DataX checks every row against rules you describe in plain English, and holds
          the ones that fail before they reach SAP, your warehouse or your AI.
        </p>

        {/* ── CTA Buttons ── Figma exact specs ──────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 0,
        }}>
          {/* Primary: Book a demo — Hug 156×47px, gradient #4069FF -> #294FED */}
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
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
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

          {/* Secondary: See how it works — Hug 180×47px, 5% white, 18% border */}
          <button
            onClick={() => {
              const el = document.getElementById('how-it-works') || document.getElementById('pipeline');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              height: 47,
              padding: '12px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              fontFamily: "'Geist', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Play size={13} style={{ fill: '#fff', flexShrink: 0 }} />
            See how it works
          </button>
        </div>

        {/* ── Conveyor Animation ─────────────────────────────── */}
        <DataStreamConveyor />

      </div>
    </section>
  );
}
