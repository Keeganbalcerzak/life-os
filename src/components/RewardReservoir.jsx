import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
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
      <motion.div
        className="reservoir-panel"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <header className="reservoir-header">
          <span className="eyebrow">Energy Vault</span>
          <h3>Stardust Reservoir</h3>
          <p>Every completed quest pours more shine into your vault. Keep the momentum and unlock a cosmic treat.</p>
        </header>

        <div className="reservoir-orb-wrapper">
          <div className="reservoir-orb-shell">
            <motion.div
              className="reservoir-liquid"
              style={{ scaleY: progress }}
            />
            <motion.div
              className="reservoir-liquid-haze"
              animate={{ opacity: [0.45, 0.65, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="reservoir-liquid-light"
              animate={{ opacity: [0.2, 0.45, 0.25], scale: [1, 1.04, 0.98] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="reservoir-surface"
              style={{ bottom: surfaceLevel }}
              animate={{ opacity: [0.9, 0.7, 0.9] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="reservoir-glass-overlay" />
          </div>
          <motion.div
            className="reservoir-orb-glow"
            animate={{ opacity: [0.25, 0.4, 0.28] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
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
          <motion.div
            className="reservoir-ready-banner"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            Vault charged! Claim your cosmic reward ✨
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
