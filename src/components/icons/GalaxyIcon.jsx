import { motion as Motion } from 'framer-motion';

export default function GalaxyIcon({ size = 64, className = '' }) {
  return (
    <Motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="galaxy-gradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="30%" stopColor="var(--color-accent)" />
          <stop offset="60%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="galaxy-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Spiral galaxy structure */}
      <ellipse cx="50" cy="50" rx="35" ry="15" fill="url(#galaxy-gradient)" opacity="0.8" filter="url(#galaxy-glow)"/>
      <ellipse cx="50" cy="50" rx="25" ry="30" fill="url(#galaxy-gradient)" opacity="0.6" transform="rotate(45 50 50)"/>
      {/* Star clusters */}
      <circle cx="35" cy="40" r="2" fill="var(--color-warning)" opacity="0.9"/>
      <circle cx="65" cy="60" r="1.5" fill="var(--color-secondary)" opacity="0.9"/>
      <circle cx="45" cy="65" r="2" fill="var(--color-warning)" opacity="0.7"/>
      <circle cx="70" cy="35" r="1.5" fill="var(--color-success)" opacity="0.8"/>
      <circle cx="30" cy="70" r="1.5" fill="var(--color-secondary)" opacity="0.7"/>
      <circle cx="55" cy="30" r="2" fill="var(--color-warning)" opacity="0.8"/>
      {/* Center glow */}
      <circle cx="50" cy="50" r="8" fill="var(--color-warning)" opacity="0.6" filter="url(#galaxy-glow)"/>
    </Motion.svg>
  );
}

