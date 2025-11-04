import { motion as Motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function TaskDustTransformation({ isActive, onComplete, reservoirPosition, originPosition }) {
  const [phase, setPhase] = useState('idle');
  const [particles, setParticles] = useState([]);

  const originX = originPosition?.x || 50;
  const originY = originPosition?.y || 50;
  const reservoirX = reservoirPosition?.x || 50;
  const reservoirY = reservoirPosition?.y || 20;

  const dx = reservoirX - originX;
  const dy = reservoirY - originY;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Minimal, fast completion animation
  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    const timers = [
      setTimeout(() => setPhase('burst'), 100),
      setTimeout(() => {
        setPhase('flow');
      }, 400),
      setTimeout(() => {
        setPhase('absorbed');
        onComplete?.();
      }, 1000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isActive, onComplete]);

  // Generate minimal particle system
  useEffect(() => {
    if (phase === 'burst') {
      const newParticles = [];
      for (let i = 0; i < 8; i++) {
        const particleAngle = (Math.random() - 0.3) * 120 + angle; // Tighter spread toward reservoir
        const speed = 25 + Math.random() * 20;

        newParticles.push({
          id: i,
          x: originX,
          y: originY,
          angle: particleAngle,
          speed,
          size: 4 + Math.random() * 3,
          delay: i * 0.03,
          color: i % 2 === 0 ? '#a855f7' : '#3b82f6',
        });
      }
      setParticles(newParticles);
    }
  }, [phase, originX, originY, angle]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1000,
      }}
    >
      {/* Phase 2: Minimal burst - Quick satisfying flash */}
      {phase === 'burst' && (
        <>
          {/* Simple central flash */}
          <Motion.div
            style={{
              position: 'absolute',
              left: `${originX}%`,
              top: `${originY}%`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.95), #a855f7, transparent)',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity',
            }}
            animate={{
              scale: [0, 1.8, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Minimal particles - quick burst toward reservoir */}
          {particles.map((particle) => {
            const angleRad = particle.angle * Math.PI / 180;
            const endX = Math.cos(angleRad) * particle.speed;
            const endY = Math.sin(angleRad) * particle.speed;

            return (
              <Motion.div
                key={particle.id}
                style={{
                  position: 'absolute',
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  borderRadius: '50%',
                  background: particle.color,
                  boxShadow: `0 0 ${particle.size * 1.5}px ${particle.color}`,
                  transform: 'translate(-50%, -50%)',
                  willChange: 'transform, opacity',
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, endX * 0.6, endX],
                  y: [0, endY * 0.6, endY],
                }}
                transition={{
                  duration: 0.4,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </>
      )}

      {/* Phase 3: Minimal flow - Quick stream to reservoir */}
      {phase === 'flow' && (
        <>
          {/* Simple flowing particles */}
          {[...Array(4)].map((_, i) => (
            <Motion.div
              key={`flow-${i}`}
              style={{
                position: 'absolute',
                left: `${originX}%`,
                top: `${originY}%`,
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: i % 2 === 0 ? '#a855f7' : '#3b82f6',
                boxShadow: `0 0 6px ${i % 2 === 0 ? '#a855f7' : '#3b82f6'}`,
                transform: 'translate(-50%, -50%)',
                willChange: 'transform, opacity',
              }}
              animate={{
                x: [0, (reservoirX - originX) * (i + 1) / 5 * 100],
                y: [0, (reservoirY - originY) * (i + 1) / 5 * 100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
