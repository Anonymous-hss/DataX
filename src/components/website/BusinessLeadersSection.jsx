import React from 'react';
import { Shield, Layers, Lock } from 'lucide-react';
import roiWindowImg from '../../assets/roi_window.png';
import exposureCardImg from '../../assets/exposure_card.png';

/**
 * BusinessLeadersSection – Exact Figma "FOR BUSINESS LEADERS"
 * Layout: 2-col. Left=text+cards, Right=ROI window.
 * Exposure card: positioned absolute OUTSIDE the ROI window, 
 * hanging down-right from the bottom-right corner of the ROI image.
 */
const FEATURES = [
  {
    icon: Shield,
    title: 'Fewer failed go-lives',
    desc: 'A pre-flight check blocks a live run until access, schema and rules are in order.',
  },
  {
    icon: Layers,
    title: 'Every exception has a price and an owner',
    desc: 'Each held record shows the rule that failed, the exposure at risk and the regulations in scope.',
  },
  {
    icon: Lock,
    title: 'Evidence auditors can check',
    desc: 'Runs, rule changes and certifications are written to a SHA-256 audit ledger.',
  },
];

export default function BusinessLeadersSection() {
  return (
    <section
      id="for-leaders"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #0A0F1F 0%, #121C45 100%)',
        paddingTop: 128,
        paddingBottom: 160,
        overflow: 'visible',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute', top: '30%', right: '15%',
          width: 520, height: 520,
          background: 'rgba(45,85,245,0.12)',
          filter: 'blur(150px)', borderRadius: '50%', pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: 64,
            alignItems: 'center',
          }}
        >
          {/* Left text column */}
          <div>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600,
              lineHeight: '130%', color: '#D4FF3A', textTransform: 'uppercase', marginBottom: 14,
            }}>
              FOR BUSINESS LEADERS
            </span>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 600,
              lineHeight: '102%', letterSpacing: '-0.035em', color: '#FFFFFF',
            }}>
              What changes for the business.
            </h2>
            <p style={{ margin: '0 0 36px 0', fontSize: 17, lineHeight: '155%', color: '#A6ADC2', fontWeight: 400 }}>
              Less time cleaning up after bad data, and a clear record of what was stopped and why.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    style={{
                      background: 'rgba(22,28,48,0.60)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, padding: 18,
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212,255,58,0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ marginTop: 3, flexShrink: 0 }}>
                      <Icon size={18} color="#D4FF3A" strokeWidth={2.0} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600, lineHeight: '150%', color: '#FFFFFF' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: '150%', color: '#A6ADC2', fontWeight: 400 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: ROI Window with exposure card protruding at bottom-right */}
          <div
            style={{
              position: 'relative',
              paddingBottom: 70,
              paddingRight: 20,
            }}
          >
            <img
              src={roiWindowImg}
              alt="Executive ROI & regulatory value"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {/* Exposure card: anchored to bottom-right of ROI window, protruding downward */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '55%',
                maxWidth: 340,
                pointerEvents: 'none',
              }}
            >
              <img
                src={exposureCardImg}
                alt="Exposure at risk"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
