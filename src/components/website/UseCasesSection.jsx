import React from 'react';
import { ArrowRight } from 'lucide-react';
import useCaseErpImg from '../../assets/use_case_erp.png';
import useCaseAiImg from '../../assets/use_case_ai_agent.png';
import useCaseMlImg from '../../assets/use_case_ml_training.png';

/**
 * UseCasesSection – Exact Figma "WHERE TEAMS START"
 * Layout: strict 2-col 50/50 grid.
 * Left: ERP card (single image, full column height).
 * Right: AI Agent + ML Training stacked with 20px gap, both flush to top.
 */
export default function UseCasesSection({ onOpenDemo }) {
  return (
    <section
      id="use-cases"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        paddingTop: 120,
        paddingBottom: 120,
        borderTop: '1px solid #E3E6EE',
        borderBottom: '1px solid #E3E6EE',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 48,
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '130%',
                letterSpacing: '0.04em',
                color: '#2D55F5',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              WHERE TEAMS START
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                fontWeight: 600,
                lineHeight: '102%',
                letterSpacing: '-0.035em',
                color: '#0A0F1F',
              }}
            >
              Three problems DataX is built for.
            </h2>
          </div>

          <button
            onClick={onOpenDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 14,
              fontWeight: 500,
              color: '#474F61',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#2D55F5')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#474F61')}
          >
            <span>Browse domain templates</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Bento Grid: strict 50/50 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left: ERP card */}
          <div
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <img
              src={useCaseErpImg}
              alt="ERP & database migration"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 24 }}
            />
          </div>

          {/* Right: AI Agent + ML Training stacked, tight 20px gap */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <img
                src={useCaseAiImg}
                alt="Keep secrets and personal data out of your AI"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 24 }}
              />
            </div>

            <div
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <img
                src={useCaseMlImg}
                alt="Certify training data before you pay for a GPU run"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 24 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
