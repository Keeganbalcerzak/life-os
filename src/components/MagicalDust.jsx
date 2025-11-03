import { motion } from 'framer-motion';

export default function MagicalDust({ count = 10, color = '#fbbf24' }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1.5,
    tx: (Math.random() - 0.5) * 200,
  }));

  return (
    <div className="magical-dust-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="dust-particle"
          initial={{ 
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: `${particle.x + particle.tx}%`,
            y: `${particle.y - 100}%`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut"
          }}
          style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}, transparent)`,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

