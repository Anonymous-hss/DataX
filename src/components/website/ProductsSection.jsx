import React, { useState } from 'react';
import productWindowImg from '../../assets/product_window.png';
import floatRowImg from '../../assets/float_row.png';
import floatQuarantineImg from '../../assets/floating_quarantine_row.png';
import preFlightImg from '../../assets/pre_flight.png';
import floatAiImg from '../../assets/float_ai_suggestion.png';
import { Layers, Box, Shield, Lock, Database } from 'lucide-react';

/**
 * ProductsSection – Exact Figma "Light floor" & "Facts" Spec
 * Features:
 *   1. Product Window showcase with 4 floating interactive chips
 *   2. 4 Building Blocks Fact Cards (Templates 10, Building Blocks 23, Check Layers 3, Rows Written 0)
 *      - Ease-out 280ms hover animation with Figma #2D55F5 blue border and elevation
 *   3. "WORKS WITH 8 systems" integration strip:
 *      - Strictly in a SINGLE horizontal line (no wrap) with clean Figma chip styling
 */

const FACT_CARDS = [
  {
    id: 'templates',
    tag: 'TEMPLATES',
    value: '10',
    desc: 'Domain templates, ready to load',
    barColor: '#D4FF3A',
    valueColor: '#D4FF3A',
    descColor: '#C2C7D6',
    bg: 'linear-gradient(180deg, #121C45 0%, #0A0F1F 100%)',
    defaultBorder: '1px solid rgba(255, 255, 255, 0.10)',
    hoverBorder: '1.5px solid #2D55F5',
    defaultShadow: '0 20px 40px -12px rgba(10, 15, 31, 0.45)',
    hoverShadow: '0 24px 48px -10px rgba(45, 85, 245, 0.32), 0 8px 20px rgba(10, 15, 31, 0.35)',
    iconBg: 'rgba(255, 255, 255, 0.08)',
    iconColor: '#D4FF3A',
    tagColor: '#8A92A6',
    icon: Layers,
  },
  {
    id: 'building-blocks',
    tag: 'BUILDING BLOCKS',
    value: '23',
    desc: 'Sources, transforms and targets to build with',
    barColor: '#2D55F5',
    valueColor: '#0A0F1F',
    descColor: '#0A0F1F',
    bg: '#FFFFFF',
    defaultBorder: '1px solid #E3E6EE',
    hoverBorder: '1.5px solid #2D55F5',
    defaultShadow: '0 8px 24px -6px rgba(10, 15, 31, 0.06)',
    hoverShadow: '0 18px 40px -10px rgba(45, 85, 245, 0.22), 0 6px 16px rgba(10, 15, 31, 0.08)',
    iconBg: '#ECF0FF',
    iconColor: '#2D55F5',
    tagColor: '#64748B',
    icon: Box,
  },
  {
    id: 'check-layers',
    tag: 'CHECK LAYERS',
    value: '3',
    desc: 'Layers of checks on every sandbox run',
    barColor: '#2D55F5',
    valueColor: '#2D55F5',
    descColor: '#0A0F1F',
    bg: 'linear-gradient(180deg, #ECF0FF 0%, #FFFFFF 100%)',
    defaultBorder: '1px solid #C9D5FF',
    hoverBorder: '1.5px solid #2D55F5',
    defaultShadow: '0 8px 24px -6px rgba(45, 85, 245, 0.10)',
    hoverShadow: '0 18px 40px -10px rgba(45, 85, 245, 0.24), 0 6px 16px rgba(10, 15, 31, 0.08)',
    iconBg: '#ECF0FF',
    iconColor: '#2D55F5',
    tagColor: '#64748B',
    icon: Shield,
  },
  {
    id: 'rows-written',
    tag: 'ROWS WRITTEN',
    value: '0',
    desc: 'Rows written to a target during a test',
    barColor: '#E2E8F0',
    valueColor: '#0A0F1F',
    descColor: '#0A0F1F',
    bg: '#FFFFFF',
    defaultBorder: '1px solid #E3E6EE',
    hoverBorder: '1.5px solid #2D55F5',
    defaultShadow: '0 8px 24px -6px rgba(10, 15, 31, 0.06)',
    hoverShadow: '0 18px 40px -10px rgba(45, 85, 245, 0.22), 0 6px 16px rgba(10, 15, 31, 0.08)',
    iconBg: '#F1F5F9',
    iconColor: '#64748B',
    tagColor: '#64748B',
    icon: Lock,
  },
];

const INTEGRATIONS = [
  'SAP BW',
  'SAP S/4HANA',
  'PostgreSQL',
  'MongoDB Atlas',
  'Snowflake',
  'Databricks',
  'Salesforce',
  'BigQuery',
];

export default function ProductsSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <>
      {/* ── 1. PRODUCT WINDOW SHOWCASE (Dark #0A0F1F, exact continuation of Hero) ── */}
      <section
        id="products"
        style={{
          position: 'relative',
          background: '#0A0F1F',
          paddingTop: 30,
          paddingBottom: 90,
          overflow: 'hidden',
          fontFamily: "'Geist', sans-serif",
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 1060,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {/* Main Product Window Image */}
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={productWindowImg} alt="DataX Product Interface" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            {/* Floating Card 1: Top-Left "1,420 rows checked" */}
            <div style={{ position: 'absolute', top: '18%', left: '-36px', width: '28%', maxWidth: 290, zIndex: 20, pointerEvents: 'none' }}>
              <img src={floatRowImg} alt="Rows Checked" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            {/* Floating Card 2: Bottom-Left "Held in quarantine" */}
            <div style={{ position: 'absolute', bottom: '12%', left: '-30px', width: '32%', maxWidth: 340, zIndex: 21, pointerEvents: 'none' }}>
              <img src={floatQuarantineImg} alt="Held in Quarantine" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            {/* Floating Card 3: Top-Right "Pre-flight check" */}
            <div style={{ position: 'absolute', top: '14%', right: '-32px', width: '29%', maxWidth: 300, zIndex: 22, pointerEvents: 'none' }}>
              <img src={preFlightImg} alt="Pre-flight Check" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            {/* Floating Card 4: Bottom-Right "Suggested rule" */}
            <div style={{ position: 'absolute', bottom: '16%', right: '-30px', width: '30%', maxWidth: 310, zIndex: 23, pointerEvents: 'none' }}>
              <img src={floatAiImg} alt="AI Suggestion" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FACTS SECTION (Figma: Facts, 1440×606 Hug, pure #FFFFFF background, clean sharp cut) ── */}
      <section
        id="facts"
        style={{
          position: 'relative',
          background: '#FFFFFF',
          paddingTop: 88,
          paddingBottom: 96,
          fontFamily: "'Geist', sans-serif",
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* ── 4 Facts Cards with Ease-Out 280ms Hover & Blue Border ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 20,
              marginBottom: 32,
            }}
          >
            {FACT_CARDS.map((card) => {
              const Icon = card.icon;
              const isHovered = hoveredCard === card.id;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: card.bg,
                    borderRadius: 20,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 285,
                    border: isHovered ? card.hoverBorder : card.defaultBorder,
                    boxShadow: isHovered ? card.hoverShadow : card.defaultShadow,
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    /* Exact Figma Ease-Out 280ms transition */
                    transition: 'transform 280ms cubic-bezier(0, 0, 0.2, 1), border 280ms cubic-bezier(0, 0, 0.2, 1), box-shadow 280ms cubic-bezier(0, 0, 0.2, 1)',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: card.tagColor, textTransform: 'uppercase' }}>
                      {card.tag}
                    </span>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={card.iconColor} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 88, fontWeight: 600, lineHeight: '92%', color: card.valueColor, letterSpacing: '-0.05em' }}>
                      {card.value}
                    </div>
                    {/* Accent bar: 32×3px, radius 2px */}
                    <div style={{ width: 32, height: 3, borderRadius: 2, background: card.barColor, marginTop: 8, marginBottom: 16 }} />
                    <p style={{ margin: 0, fontSize: 15, lineHeight: '145%', color: card.descColor, fontWeight: 500 }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 3. WORKS WITH 8 SYSTEMS STRIP (Guaranteed STRICT SINGLE LINE, no wrap) ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              width: '100%',
              minHeight: 68,
              padding: '12px 18px',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E3E6EE',
              boxShadow: '0 8px 24px -6px rgba(10, 15, 31, 0.05)',
              boxSizing: 'border-box',
              overflow: 'hidden',
              gap: 16,
            }}
          >
            {/* Label: "WORKS WITH 
 8 systems" (Figma 2-line lockup) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: '130%', letterSpacing: '0.04em', color: '#5F6678', textTransform: 'uppercase' }}>
                WORKS WITH
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '130%', color: '#2D55F5' }}>
                8 systems
              </span>
            </div>

            {/* 8 System Chips in a strictly non-wrapping horizontal row */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                justifyContent: 'space-between',
              }}
            >
              {INTEGRATIONS.map((system) => (
                <div
                  key={system}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 38,
                    paddingTop: 5,
                    paddingBottom: 5,
                    paddingLeft: 5,
                    paddingRight: 8,
                    borderRadius: 12,
                    background: '#F9FAFC',
                    border: '1px solid #ECEFF5',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    transition: 'border-color 200ms ease, background 200ms ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(45, 85, 245, 0.4)';
                    e.currentTarget.style.background = '#F0F4FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ECEFF5';
                    e.currentTarget.style.background = '#F9FAFC';
                  }}
                >
                  {/* 26×26px icon box */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: '#FFFFFF',
                      border: '1px solid #E3E6EE',
                      boxShadow: '0 1px 2px rgba(10, 15, 31, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Database size={13} color="#2D55F5" />
                  </div>
                  {/* System Name */}
                  <span
                    style={{
                      fontFamily: "'Geist', sans-serif",
                      fontSize: 11.5,
                      fontWeight: 500,
                      lineHeight: '140%',
                      color: '#0A0F1F',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {system}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
