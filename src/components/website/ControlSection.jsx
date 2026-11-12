import React from 'react';
import { Check } from 'lucide-react';
import reviewWindowImg from '../../assets/review_window.png';
import ctaBannerImg from '../../assets/cta_banner.png';

/**
 * ControlSection – Exact Figma "CONTROL" Spec
 * Screenshots show:
 *   - Left: Figma "Backdrop" container: 680×843px, radius 32px,
 *     linear-gradient(#D9F3FF 0%, #ECF0FF 100%) — the review_window sits inside this
 *   - Right: CONTROL eyebrow + "AI drafts. Your team decides." headline + 3 checkmark bullets
 *   - Bottom: cta_banner.png full width, Closing CTA section
 */
const BULLETS = [
  {
    title: 'Every suggestion explains itself',
    desc: 'Each proposed step shows why it is there and what it was based on.',
  },
  {
    title: 'Nothing goes live without approval',
    desc: 'Suggestions are accepted, edited or rejected one by one.',
  },
  {
    title: 'See the impact before you change a rule',
    desc: 'DataX replays the last run and shows how many rows would move.',
  },
];

export default function ControlSection({ onOpenDemo }) {
  return (
    <section
      id="control"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        paddingTop: 128,
        paddingBottom: 128,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* ── 2-Column Split: Backdrop + Review Window on Left, Copy on Right ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 480px',
            gap: 64,
            alignItems: 'center',
            marginBottom: 96,
          }}
        >
          {/* ── Left Column: review_window image rendered directly (no artificial blue backdrop) ── */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={reviewWindowImg}
              alt="Build with AI review window"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {/* ── Right Column: Control Typography & Bullets ── */}
          <div>
            {/* Eyebrow: DX/eyebrow Geist 600, 12px, #2D55F5 */}
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '130%',
                letterSpacing: '0%',
                color: '#2D55F5',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              CONTROL
            </span>

            {/* Headline: Geist 600 SemiBold, 56px, 102% lh, -3.5% tracking */}
            <h2
              style={{
                margin: '0 0 36px 0',
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                fontWeight: 600,
                lineHeight: '102%',
                letterSpacing: '-0.035em',
                color: '#0A0F1F',
              }}
            >
              AI drafts. Your<br />team decides.
            </h2>

            {/* 3 Check Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {BULLETS.map((bullet) => (
                <div key={bullet.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div
                    style={{
                      marginTop: 2,
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: '#ECF0FF',
                      border: '1px solid #C9D5FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={13} color="#2D55F5" strokeWidth={2.6} />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: 17,
                        fontWeight: 600,
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        color: '#0A0F1F',
                      }}
                    >
                      {bullet.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        color: '#474E61',
                        fontWeight: 400,
                      }}
                    >
                      {bullet.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Closing CTA Banner (cta_banner.png direct render) ── */}
        <div
          onClick={onOpenDemo}
          style={{
            position: 'relative',
            width: '100%',
            cursor: 'pointer',
            borderRadius: 24,
            overflow: 'hidden',
            transition: 'transform 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <img
            src={ctaBannerImg}
            alt="See DataX on your own data"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>
    </section>
  );
}
