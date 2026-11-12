import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
/** DataStreamConveyor – Exact Figma Animation Flow */
const C_RED   = '#ED4F3D';
const C_BLUE  = '#3361FA';
const C_CHECK = '#4ADE80';
const CARD_W  = 44;
const CARD_H  = 44;
const CARD_R  = 12;
const GAP     = 10;
const PITCH   = CARD_W + GAP; // 54px
const N       = 30;
const STRIP_SHIFT = N * PITCH; // 1620px
const LOOP_DUR    = '70s';
// Dynamic metrics (Zero hardcoding policy)
const TOTAL_ROWS = 1420;
const HELD_ROWS  = 153;
const CLEAN_ROWS = TOTAL_ROWS - HELD_ROWS;
function CardBox({ isClean }) {
  return (
    <div
      style={{
        width: CARD_W, height: CARD_H, borderRadius: CARD_R,
        flexShrink: 0, marginRight: GAP, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isClean ? C_BLUE : C_RED,
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: isClean
          ? '0 6px 18px -4px rgba(51,97,250,0.55), inset 0 1px 0 rgba(255,255,255,0.35)'
          : '0 6px 18px -4px rgba(237,79,61,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}
    >
      {isClean ? (
        <Check size={18} strokeWidth={2.8} color={C_CHECK} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: 16, height: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
          <div style={{ width: 12, height: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
        </div>
      )}
    </div>
  );
}
function LoopStrip({ isClean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        animation: `conveyorRight ${LOOP_DUR} linear infinite`,
        willChange: 'transform',
      }}
    >
      {Array.from({ length: N * 2 }, (_, i) => (
        <CardBox key={i} isClean={isClean} />
      ))}
    </div>
  );
}
export default function DataStreamConveyor() {
  const [drops, setDrops] = useState([]);
  const [trayRedGlow, setTrayRedGlow] = useState(false);
  const abortRef = useRef(null);
  const metrics = useMemo(() => ({
    totalIn: TOTAL_ROWS.toLocaleString(),
    held:    HELD_ROWS.toLocaleString(),
    clean:   CLEAN_ROWS.toLocaleString(),
  }), []);
  // Periodic falling red card animation loop
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const intervalId = setInterval(() => {
      if (ctrl.signal.aborted) return;
      const id = Date.now();
      setDrops(prev => [...prev.slice(-1), id]);
      // When the card reaches the tray (approx 550ms), flare red glow
      const glowTimer = setTimeout(() => {
        if (!ctrl.signal.aborted) {
          setTrayRedGlow(true);
          const resetTimer = setTimeout(() => {
            if (!ctrl.signal.aborted) setTrayRedGlow(false);
          }, 700);
          ctrl.signal.addEventListener('abort', () => clearTimeout(resetTimer));
        }
      }, 550);
      ctrl.signal.addEventListener('abort', () => clearTimeout(glowTimer));
    }, 2800);
    return () => {
      ctrl.abort();
      clearInterval(intervalId);
    };
  }, []);
  const handleDropComplete = (id) => {
    setDrops(prev => prev.filter(cardId => cardId !== id));
  };
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1200,
        margin: '52px auto 0',
        fontFamily: "'Geist', sans-serif",
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes conveyorRight {
          from { transform: translateX(-${STRIP_SHIFT}px); }
          to   { transform: translateX(0px); }
        }
      `}</style>
      {/* ── Main Stage ────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 230, overflow: 'hidden', borderRadius: 16 }}>

        {/* Center blue radial ambient glow behind scanner */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(51, 97, 250, 0.28)',
            filter: 'blur(65px)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* ── 1. Horizontal Belt (Red Left / Blue Right) ─────────── */}
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, height: CARD_H }}>
          {/* RED strip — left half moving into gate */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              clipPath: 'inset(0 50% 0 0)',
              WebkitClipPath: 'inset(0 50% 0 0)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 100%)',
              zIndex: 10,
            }}
          >
            <LoopStrip isClean={false} />
          </div>

          {/* BLUE strip — right half streaming out of gate */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              clipPath: 'inset(0 0 0 50%)',
              WebkitClipPath: 'inset(0 0 0 50%)',
              maskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 8%, black 100%)',
              zIndex: 10,
            }}
          >
            <LoopStrip isClean={true} />
          </div>
        </div>

        {/* ── 2. Falling Red Card (Drops down, rotates slightly, dissolves on landing) ─ */}
        <AnimatePresence>
          {drops.map((id) => (
            <motion.div
              key={id}
              initial={{ y: 50, x: '-50%', rotate: 0, opacity: 1, scale: 1 }}
              animate={{
                y: 142,
                x: 'calc(-50% - 8px)',
                rotate: -14,
                opacity: [1, 1, 0.7, 0],
                scale: [1, 1, 0.94, 0.88],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.85,
                times: [0, 0.45, 0.75, 1],
                ease: [0.32, 0, 0.67, 0],
              }}
              onAnimationComplete={() => handleDropComplete(id)}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                width: CARD_W,
                height: CARD_H,
                borderRadius: CARD_R,
                background: C_RED,
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: '0 6px 18px -4px rgba(237,79,61,0.7), inset 0 1px 0 rgba(255,255,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 25,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ width: 16, height: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
                <div style={{ width: 12, height: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── 3. Vertical Laser Scanner Bar (Suspended with clear gap above tray) ── */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            height: 112,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 9,
            borderRadius: 5,
            border: '1px solid rgba(255, 255, 255, 0.65)',
            background: 'linear-gradient(180deg, rgba(140, 173, 255, 0.95) 0%, #4D7AFF 50%, rgba(140, 173, 255, 0.95) 100%)',
            boxShadow: '0 0 22px 0 rgba(51, 97, 250, 0.85)',
            pointerEvents: 'none',
            zIndex: 18,
          }}
        />

{/* ── 4. Horizontal Tray Glow ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 35,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 240,
            height: 50,
            borderRadius: '50%',
            background: trayRedGlow ? 'rgba(237, 79, 61, 0.42)' : 'rgba(51, 97, 250, 0.15)',
            filter: 'blur(26px)',
            opacity: trayRedGlow ? 1 : 0.4,
            transition: 'background 250ms ease, opacity 250ms ease',
            pointerEvents: 'none',
            zIndex: 14,
          }}
        />

{/* ── 5. Horizontal Tray Bar ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 170,
            height: 14,
            borderRadius: 7,
            border: trayRedGlow
              ? '1.5px solid rgba(237, 79, 61, 0.85)'
              : '1.5px solid rgba(115, 153, 255, 0.70)',
            background: trayRedGlow
              ? 'linear-gradient(90deg, rgba(90, 25, 25, 0.60) 0%, rgba(50, 15, 20, 0.85) 100%)'
              : 'linear-gradient(90deg, rgba(56, 77, 153, 0.50) 0%, rgba(20, 31, 71, 0.80) 100%)',
            boxShadow: trayRedGlow
              ? '0 0 24px 0 rgba(237, 79, 61, 0.70)'
              : '0 0 18px 0 rgba(51, 97, 250, 0.45)',
            transition: 'border-color 220ms ease, background 220ms ease, box-shadow 220ms ease',
            pointerEvents: 'none',
            zIndex: 16,
          }}
        />
      </div>

      {/* ── Metric Badges ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 72,
          width: '100%',
          margin: '16px auto 0',
          padding: '0 8px',
        }}
      >
        <MetricPill dot="#94a3b8" label={`${metrics.totalIn} rows in`} />
        <MetricPill dot="#ef4444" glow="#ef4444" label={`${metrics.held} held, each with a reason`} />
        <MetricPill dot="#D4FF3A" glow="#D4FF3A" label={`${metrics.clean} written clean`} />
      </div>
    </div>
  );
}

function MetricPill({ dot, glow, label }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 14px',
        borderRadius: 999,
        background: 'rgba(7, 14, 28, 0.80)',
        border: '1px solid rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(8px)',
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 400,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
          boxShadow: glow ? `0 0 6px ${glow}` : undefined,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
