import { motion as Motion } from 'framer-motion';

export default function CelebrationIcon({ size = 48, className = '' }) {
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
        <linearGradient id="celebration-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Trophy/Crown shape */}
      <path
        d="M30 70 L30 40 L25 40 L25 35 L35 35 L35 40 L30 40 L30 70 Z M70 70 L70 40 L65 40 L65 35 L75 35 L75 40 L70 40 L70 70 Z M50 30 L45 40 L50 45 L55 40 Z"
        fill="url(#celebration-gold)"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      {/* Celebration rays */}
      <line x1="50" y1="10" x2="50" y2="30" stroke="url(#celebration-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="30" y1="15" x2="40" y2="25" stroke="url(#celebration-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="70" y1="15" x2="60" y2="25" stroke="url(#celebration-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="25" x2="30" y2="30" stroke="url(#celebration-gold)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="80" y1="25" x2="70" y2="30" stroke="url(#celebration-gold)" strokeWidth="2" strokeLinecap="round"/>
      {/* Base */}
      <rect x="25" y="70" width="50" height="8" fill="url(#celebration-gold)" rx="2"/>
    </Motion.svg>
  );
}

