import { motion } from 'framer-motion';

export default function SparkleIcon({ size = 24, className = '' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Main sparkle shape */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="url(#sparkle-gradient)"
        filter="url(#glow)"
        stroke="#f59e0b"
        strokeWidth="0.5"
      />
      {/* Smaller sparkle details */}
      <circle cx="12" cy="5" r="1.5" fill="#fef3c7" opacity="0.8"/>
      <circle cx="16" cy="10" r="1" fill="#fef3c7" opacity="0.6"/>
      <circle cx="8" cy="10" r="1" fill="#fef3c7" opacity="0.6"/>
      <circle cx="12" cy="15" r="1.5" fill="#fef3c7" opacity="0.8"/>
    </motion.svg>
  );
}

