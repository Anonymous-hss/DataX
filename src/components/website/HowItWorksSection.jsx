import React, { useState } from 'react';
import step1Img from '../../assets/step1.png';
import step2Img from '../../assets/step2.png';
import step3Img from '../../assets/step3.png';
import { ArrowRight } from 'lucide-react';

/**
 * HowItWorksSection – Exact Figma "HOW IT WORKS" Spec
 * Features:
 *   - Eyebrow: "HOW IT WORKS" (Geist 600, 12px, #2D55F5)
 *   - Headline: "From one sentence to rules that check every row." (Geist 600, 56px, -3.5% tracking)
 *   - Subtitle: "The same three steps for every workflow. Nothing reaches a target system until it has passed."
 *   - 3 Step Images placed in a single 3-column row
 *   - Directly hover the image (no artificial white wrapper card / no double boxes)
 *   - Connecting blue arrow circles between Step 1-2 and Step 2-3
 */

const STEPS = [
  {
    id: 1,
    img: step1Img,
    alt: 'Step 1: Describe what clean means',
  },
  {
    id: 2,
    img: step2Img,
    alt: 'Step 2: Test before anything is written',
  },
  {
    id: 3,
    img: step3Img,
    alt: 'Step 3: Run live, with every exception explained',
  },
];

export default function HowItWorksSection() {
  const [hoveredStep, setHoveredStep] = useState(null);

  return (
    <section
      id="how-it-works"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        paddingTop: 100,
        paddingBottom: 110,
        overflow: 'hidden',
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Section Header ──────────────────────────────────── */}
        <div style={{ maxWidth: 780, marginBottom: 56 }}>
          {/* Eyebrow: DX/eyebrow (Geist 600, 12px, 130% lh, #2D55F5) */}
          <div
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '130%',
              letterSpacing: '0%',
              color: '#2D55F5',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            HOW IT WORKS
          </div>

          {/* Headline: Geist 600 SemiBold, 56px, 102% line-height, -3.5% letter spacing */}
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: 600,
              lineHeight: '102%',
              letterSpacing: '-0.035em',
              color: '#0A0F1F',
            }}
          >
            From one sentence to rules that check every row.
          </h2>

          {/* Subtitle: Geist 400 Regular, 17px, 155% line-height, #474F61 */}
          <p
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 400,
              lineHeight: '155%',
              letterSpacing: '0%',
              color: '#474F61',
              maxWidth: 640,
            }}
          >
            The same three steps for every workflow. Nothing reaches a target system until it has passed.
          </p>
        </div>

        {/* ── 3 Steps in a single horizontal row with direct image hover (no outer box) ── */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr auto 1fr',
            alignItems: 'center',
            gap: 16,
            width: '100%',
          }}
        >
          {STEPS.map((step, idx) => {
            const isHovered = hoveredStep === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Step Card — Render image directly without background / border wrapper */}
                <div
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  <img
                    src={step.img}
                    alt={step.alt}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 24,
                    }}
                  />
                </div>

                {/* Connecting blue arrow circle between Step 1-2 and Step 2-3 */}
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#2D55F5',
                      boxShadow: '0 4px 12px rgba(45, 85, 245, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 5,
                    }}
                  >
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
