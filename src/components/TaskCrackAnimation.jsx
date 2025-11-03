import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function TaskCrackAnimation({ isActive, onComplete, reservoirPosition, originPosition, containerSize }) {
  const [phase, setPhase] = useState('glow');
  const [crackSegments, setCrackSegments] = useState([]);
  const [lightBeams, setLightBeams] = useState([]);
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);

  // Use origin position (status button) or default to left side
  const originX = originPosition?.x || 15;
  const originY = originPosition?.y || 50;

  // Calculate container dimensions - use actual size or fallback
  const containerWidth = containerSize?.width || 400;
  const containerHeight = containerSize?.height || 100;
  const containerAspectRatio = containerWidth / containerHeight;
  
  // Calculate edge positions in percentage
  const leftEdge = 0;
  const rightEdge = 100;
  const topEdge = 0;
  const bottomEdge = 100;
  
  // Calculate distances from origin to each edge
  const distToLeft = originX;
  const distToRight = rightEdge - originX;
  const distToTop = originY;
  const distToBottom = bottomEdge - originY;
  
  // Max distance to any edge - this is how far cracks should spread
  const maxDistanceToEdge = Math.max(distToLeft, distToRight, distToTop, distToBottom);

  // Phase transitions - slower and more deliberate
  useEffect(() => {
    if (!isActive) {
      setPhase('glow');
      setCrackSegments([]);
      setLightBeams([]);
      setParticles([]);
      return;
    }

    const timer1 = setTimeout(() => setPhase('crack'), 400);
    const timer2 = setTimeout(() => setPhase('burst'), 1200);
    const timer3 = setTimeout(() => setPhase('beams'), 1800);
    const timer4 = setTimeout(() => setPhase('fade'), 4800);
    const timer5 = setTimeout(() => {
      onComplete?.();
      setPhase('glow');
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isActive, onComplete]);

  // Generate organic crack pattern that reaches edges
  useEffect(() => {
    if (phase === 'crack' || phase === 'burst') {
      const segments = [];
      const numBranches = 10;
      
      // Create main branches that reach different edges
      const edgeTargets = [
        { angle: 0, edge: 'left', x: leftEdge, y: originY },      // Left
        { angle: 90, edge: 'top', x: originX, y: topEdge },       // Top
        { angle: 180, edge: 'right', x: rightEdge, y: originY },  // Right
        { angle: 270, edge: 'bottom', x: originX, y: bottomEdge }, // Bottom
        // Diagonal targets for corners
        { angle: 45, edge: 'top-left', x: leftEdge, y: topEdge },
        { angle: 135, edge: 'top-right', x: rightEdge, y: topEdge },
        { angle: 225, edge: 'bottom-right', x: rightEdge, y: bottomEdge },
        { angle: 315, edge: 'bottom-left', x: leftEdge, y: bottomEdge },
      ];
      
      // Main branches to edges
      edgeTargets.forEach((target, i) => {
        const angleToTarget = (Math.atan2(target.y - originY, target.x - originX) * 180) / Math.PI;
        const distanceToTarget = Math.sqrt(
          Math.pow(target.x - originX, 2) + Math.pow(target.y - originY, 2)
        );
        
        // Create path to edge with organic branching
        let currentX = originX;
        let currentY = originY;
        const numSegments = 4 + Math.floor(Math.random() * 3);
        
        for (let seg = 0; seg < numSegments; seg++) {
          const progress = seg / numSegments;
          const targetX = originX + (target.x - originX) * progress + (Math.random() - 0.5) * 5;
          const targetY = originY + (target.y - originY) * progress + (Math.random() - 0.5) * 5;
          
          // Ensure we stay within bounds
          const clampedX = Math.max(2, Math.min(98, targetX));
          const clampedY = Math.max(2, Math.min(98, targetY));
          
          segments.push({
            id: `main-${i}-${seg}`,
            x1: currentX,
            y1: currentY,
            x2: clampedX,
            y2: clampedY,
            delay: seg * 0.12 + i * 0.04,
            opacity: 1 - progress * 0.2,
          });
          
          currentX = clampedX;
          currentY = clampedY;
          
          // Add side branches
          if (seg < numSegments - 1 && Math.random() > 0.5) {
            const branchAngle = angleToTarget + (Math.random() - 0.5) * 40;
            const branchLength = 8 + Math.random() * 12;
            const branchX = Math.max(2, Math.min(98, currentX + Math.cos((branchAngle * Math.PI) / 180) * branchLength));
            const branchY = Math.max(2, Math.min(98, currentY + Math.sin((branchAngle * Math.PI) / 180) * branchLength));
            
            segments.push({
              id: `branch-${i}-${seg}`,
              x1: currentX,
              y1: currentY,
              x2: branchX,
              y2: branchY,
              delay: seg * 0.12 + i * 0.04 + 0.08,
              opacity: 0.7 - progress * 0.3,
            });
          }
        }
      });
      
      // Add some random organic cracks that don't necessarily reach edges
      for (let i = 0; i < 6; i++) {
        const randomAngle = Math.random() * 360;
        const randomLength = 15 + Math.random() * maxDistanceToEdge * 0.4;
        const numSegments = 2 + Math.floor(Math.random() * 2);
        
        let currentX = originX;
        let currentY = originY;
        
        for (let seg = 0; seg < numSegments; seg++) {
          const segAngle = randomAngle + (Math.random() - 0.5) * 20;
          const segLength = randomLength / numSegments;
          const nextX = Math.max(2, Math.min(98, currentX + Math.cos((segAngle * Math.PI) / 180) * segLength));
          const nextY = Math.max(2, Math.min(98, currentY + Math.sin((segAngle * Math.PI) / 180) * segLength));
          
          segments.push({
            id: `random-${i}-${seg}`,
            x1: currentX,
            y1: currentY,
            x2: nextX,
            y2: nextY,
            delay: seg * 0.1 + edgeTargets.length * 0.04 + i * 0.03,
            opacity: 0.6 - (seg / numSegments) * 0.3,
          });
          
          currentX = nextX;
          currentY = nextY;
        }
      }
      
      setCrackSegments(segments);
    }
  }, [phase, originX, originY, maxDistanceToEdge]);

  // Generate light beams that flow to reservoir
  useEffect(() => {
    if (phase === 'beams' || phase === 'fade') {
      const beamCount = 10;
      const beams = [];
      
      for (let i = 0; i < beamCount; i++) {
        const angle = (i * 360) / beamCount + (Math.random() - 0.5) * 20;
        const spiralRadius = Math.min(15, maxDistanceToEdge * 0.2);
        
        beams.push({
          id: i,
          angle: angle,
          spiralRadius,
          delay: i * 0.1,
          duration: 2.5 + Math.random() * 1,
          particleCount: 2 + Math.floor(Math.random() * 3),
        });
      }
      
      setLightBeams(beams);
      
      const allParticles = [];
      beams.forEach((beam) => {
        for (let p = 0; p < beam.particleCount; p++) {
          allParticles.push({
            id: `${beam.id}-${p}`,
            beamId: beam.id,
            delay: beam.delay + p * 0.3,
            offset: Math.random(),
          });
        }
      });
      setParticles(allParticles);
    }
  }, [phase, maxDistanceToEdge]);

  if (!isActive) return null;

  const reservoirX = reservoirPosition?.x || 50;
  const reservoirY = reservoirPosition?.y || 20;

  // Calculate distance and angle to reservoir from origin
  const dx = reservoirX - originX;
  const dy = reservoirY - originY;
  const distanceToReservoir = Math.sqrt(dx * dx + dy * dy);
  const angleToReservoir = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      ref={containerRef}
      className="crack-animation-container"
      style={{
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1000,
      }}
    >
      {/* Phase 1: Glowing pulse from origin */}
      {phase === 'glow' && (
        <motion.div
          style={{
            position: 'absolute',
            left: `${originX}%`,
            top: `${originY}%`,
            width: `${Math.min(80, containerWidth * 0.2)}px`,
            height: `${Math.min(80, containerHeight * 0.8)}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, 
              rgba(139, 92, 246, 0.5), 
              rgba(6, 182, 212, 0.4), 
              rgba(16, 185, 129, 0.3),
              transparent)`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.2, 1],
            opacity: [0, 0.7, 0.5],
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}

      {/* Phase 2 & 3: Organic crack network that reaches edges */}
      {(phase === 'crack' || phase === 'burst') && (
        <svg
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
          }}
        >
          <defs>
            <linearGradient id={`crackGradient-${originX}-${originY}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="33%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="66%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
            </linearGradient>
            <filter id={`crackGlow-${originX}-${originY}`}>
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {crackSegments.map((seg) => (
            <motion.line
              key={seg.id}
              x1={`${seg.x1}%`}
              y1={`${seg.y1}%`}
              x2={`${seg.x2}%`}
              y2={`${seg.y2}%`}
              stroke={`url(#crackGradient-${originX}-${originY})`}
              strokeWidth={phase === 'burst' ? '2.5' : '2'}
              strokeLinecap="round"
              filter={`url(#crackGlow-${originX}-${originY})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, seg.opacity, phase === 'burst' ? seg.opacity * 1.3 : seg.opacity],
              }}
              transition={{
                duration: phase === 'burst' ? 0.25 : 0.6,
                delay: seg.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </svg>
      )}

      {/* Phase 3: Light burst from origin */}
      {phase === 'burst' && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              left: `${originX}%`,
              top: `${originY}%`,
              width: `${Math.min(100, containerWidth * 0.25)}px`,
              height: `${Math.min(100, containerHeight)}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, 
                rgba(139, 92, 246, 1), 
                rgba(6, 182, 212, 0.9), 
                rgba(16, 185, 129, 0.8),
                transparent)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(6px)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 2, 2.5],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          
          <motion.div
            style={{
              position: 'absolute',
              left: `${originX}%`,
              top: `${originY}%`,
              width: `${Math.min(50, containerWidth * 0.125)}px`,
              height: `${Math.min(50, containerHeight * 0.5)}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, 
                rgba(255, 255, 255, 0.95), 
                rgba(139, 92, 246, 0.8), 
                transparent)`,
              transform: 'translate(-50%, -50%)',
              boxShadow: `
                0 0 25px rgba(139, 92, 246, 1),
                0 0 50px rgba(6, 182, 212, 0.9),
                0 0 75px rgba(16, 185, 129, 0.7)
              `,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1.5, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </>
      )}

      {/* Phase 4 & 5: Light beams flowing to reservoir */}
      {(phase === 'beams' || phase === 'fade') && (
        <>
          {lightBeams.map((beam) => {
            const beamAngleRad = (beam.angle * Math.PI) / 180;
            const spiralTurns = 1;
            
            return (
              <motion.div
                key={beam.id}
                style={{
                  position: 'absolute',
                  left: `${originX}%`,
                  top: `${originY}%`,
                  width: '3px',
                  height: `${Math.min(distanceToReservoir * 1.1, 500)}px`,
                  background: `linear-gradient(to bottom, 
                    rgba(139, 92, 246, 1), 
                    rgba(6, 182, 212, 0.95), 
                    rgba(16, 185, 129, 0.9),
                    rgba(139, 92, 246, 0.7),
                    transparent)`,
                  boxShadow: `
                    0 0 12px rgba(139, 92, 246, 1),
                    0 0 24px rgba(6, 182, 212, 0.8),
                    0 0 36px rgba(16, 185, 129, 0.6)
                  `,
                  transformOrigin: 'top center',
                  borderRadius: '2px',
                }}
                initial={{
                  opacity: 0,
                  scaleY: 0,
                  x: 0,
                  y: 0,
                  rotate: `${beam.angle}deg`,
                }}
                animate={{
                  opacity: [0, 1, 1, 0.9, 0],
                  scaleY: [0, 0.5, 1, 1, 0],
                  x: [
                    0,
                    Math.cos(beamAngleRad) * beam.spiralRadius * 1.5,
                    Math.cos(beamAngleRad) * beam.spiralRadius * 2.5 + Math.cos((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.6,
                    Math.cos((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.85,
                  ],
                  y: [
                    0,
                    Math.sin(beamAngleRad) * beam.spiralRadius * 1.5,
                    Math.sin(beamAngleRad) * beam.spiralRadius * 2.5 + Math.sin((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.6,
                    Math.sin((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.85,
                  ],
                  rotate: [
                    `${beam.angle}deg`,
                    `${beam.angle + 120}deg`,
                    `${beam.angle + 240}deg`,
                    `${angleToReservoir}deg`,
                  ],
                }}
                transition={{
                  duration: beam.duration,
                  delay: beam.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            );
          })}

          {particles.map((particle) => {
            const beam = lightBeams.find((b) => b.id === particle.beamId);
            if (!beam) return null;
            
            const beamAngleRad = (beam.angle * Math.PI) / 180;
            const progress = particle.offset;
            
            return (
              <motion.div
                key={particle.id}
                style={{
                  position: 'absolute',
                  left: `${originX}%`,
                  top: `${originY}%`,
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, 
                    rgba(255, 255, 255, 1), 
                    rgba(139, 92, 246, 0.9), 
                    rgba(6, 182, 212, 0.8))`,
                  boxShadow: `
                    0 0 8px rgba(139, 92, 246, 1),
                    0 0 16px rgba(6, 182, 212, 0.8),
                    0 0 24px rgba(16, 185, 129, 0.6)
                  `,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  scale: [0, 1.1, 1, 0.9, 0],
                  x: [
                    0,
                    Math.cos(beamAngleRad) * 20 * progress,
                    Math.cos(beamAngleRad) * 40 * progress + Math.cos((angleToReservoir * Math.PI) / 180) * distanceToReservoir * progress * 0.7,
                    Math.cos((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.8,
                  ],
                  y: [
                    0,
                    Math.sin(beamAngleRad) * 20 * progress,
                    Math.sin(beamAngleRad) * 40 * progress + Math.sin((angleToReservoir * Math.PI) / 180) * distanceToReservoir * progress * 0.7,
                    Math.sin((angleToReservoir * Math.PI) / 180) * distanceToReservoir * 0.8,
                  ],
                }}
                transition={{
                  duration: 2.2,
                  delay: particle.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          })}
        </>
      )}

      {/* Continuous subtle glow */}
      {isActive && (
        <motion.div
          style={{
            position: 'absolute',
            left: `${originX}%`,
            top: `${originY}%`,
            width: `${Math.min(150, containerWidth)}px`,
            height: `${Math.min(150, containerHeight * 1.5)}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, 
              rgba(139, 92, 246, ${phase === 'burst' ? 0.25 : phase === 'beams' ? 0.15 : 0.1}), 
              rgba(6, 182, 212, ${phase === 'burst' ? 0.2 : phase === 'beams' ? 0.12 : 0.06}), 
              transparent)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
          animate={{
            opacity: phase === 'fade' ? [0.3, 0] : [0.2, 0.4, 0.2],
            scale: phase === 'burst' ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: phase === 'burst' ? 0.5 : 3,
            repeat: phase === 'fade' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
