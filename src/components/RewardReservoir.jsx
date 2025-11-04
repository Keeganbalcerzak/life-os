import { motion as Motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

export default function RewardReservoir({ level, maxLevel = 100, onFull }) {
  const fillLevel = useMotionValue(level);
  const progress = useTransform(fillLevel, (value) => {
    if (!maxLevel || maxLevel <= 0) return 0;
    const ratio = value / maxLevel;
    return Math.min(1, Math.max(0, ratio));
  });
  const surfaceLevel = useTransform(progress, (value) => `${value * 100}%`);

  useEffect(() => {
    const controls = animate(fillLevel, level, { duration: 0.8, ease: 'easeOut' });
    
    if (level >= maxLevel && onFull) {
      const timer = setTimeout(() => onFull(), 600);
      return () => {
        clearTimeout(timer);
        controls.stop();
      };
    }

    return () => controls.stop();
  }, [level, maxLevel, fillLevel, onFull]);

  const percent = Math.min(100, Math.round((level / maxLevel) * 100));
  const remainingDust = Math.max(0, maxLevel - level);

  return (
    <div className="reservoir-container">
      <div className="reservoir-panel">
        <header className="reservoir-header">
          <span className="eyebrow">Energy Vault</span>
          <h3>Stardust Reservoir</h3>
          <p>Every completed quest pours more shine into your vault. Keep the momentum and unlock a cosmic treat.</p>
        </header>

        <div className="reservoir-orb-wrapper">
          {/* Orbiting accents for a more dynamic, cosmic feel */}
          <div className="reservoir-orbits" aria-hidden>
            <div className="orbit orbit-1"><span className="orb-dot" /></div>
            <div className="orbit orbit-2"><span className="orb-dot" /></div>
            <div className="orbit orbit-3"><span className="orb-dot" /></div>
          </div>
          <div className="reservoir-orb-shell">
            <Motion.div
              className="reservoir-liquid"
              style={{ scaleY: progress }}
            />
            <div className="reservoir-liquid-haze" />
            <Motion.div className="reservoir-surface" style={{ bottom: surfaceLevel }} />
          </div>
        </div>

        <div className="reservoir-readout">
          <div>
            <span className="label">Fill Status</span>
            <strong>{percent}%</strong>
          </div>
          <div>
            <span className="label">To Reward</span>
            <strong>{remainingDust <= 0 ? 'Ready!' : `${remainingDust} dust`}</strong>
          </div>
        </div>

        <div className="reservoir-footnote">
          <p>High priority missions burst the vault with extra dust. Stack them when you crave a dopamine meteor shower.</p>
        </div>

        {level >= maxLevel && (
          <div className="reservoir-ready-banner">
            Vault charged! Claim your cosmic reward ✨
          </div>
        )}
      </div>
    </div>
  );
}
