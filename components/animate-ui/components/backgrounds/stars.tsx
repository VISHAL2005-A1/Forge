'use client';

import * as React from 'react';
import { motion, type Transition } from 'framer-motion';
import { useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ---------------- TYPES ---------------- */

type StarLayerProps = React.ComponentProps<typeof motion.div> & {
  count: number;
  size: number;
  transition: Transition;
  starColor: string;
};

/* ---------------- STAR GENERATOR ---------------- */

function generateStars(count: number, starColor: string) {
  const shadows: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${starColor}`);
  }

  return shadows.join(', ');
}

/* ---------------- STAR LAYER ---------------- */

function StarLayer({
  count,
  size,
  transition,
  starColor,
  className,
  ...props
}: StarLayerProps) {
  const boxShadow = React.useMemo(
    () => generateStars(count, starColor),
    [count, starColor]
  );

  return (
    <motion.div
      data-slot="star-layer"
      animate={{ y: [0, -2000] }}
      transition={transition}
      className={cn('absolute top-0 left-0 w-full h-[2000px]', className)}
      {...props}
    >
      <div
        className="absolute rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />

      <div
        className="absolute top-[2000px] rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
    </motion.div>
  );
}
/* ---------------- BACKGROUND ---------------- */

type StarsBackgroundProps = React.ComponentProps<'div'> & {
  factor?: number;
  speed?: number;
  starColor?: string;
  pointerEvents?: boolean;
};

function StarsBackground({
  children,
  className,
  factor = 0.05,
  speed = 50,
  starColor = '#fff',
  pointerEvents = true,
  ...props
}: StarsBackgroundProps) {
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);

  const springX = useSpring(offsetX, { stiffness: 50, damping: 20 });
  const springY = useSpring(offsetY, { stiffness: 50, damping: 20 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      offsetX.set(-(e.clientX - centerX) * factor);
      offsetY.set(-(e.clientY - centerY) * factor);
    },
    [offsetX, offsetY, factor]
  );

  return (
    <div
      data-slot="stars-background"
      className={cn(
        'relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)]',
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        className={cn(!pointerEvents && 'pointer-events-none')}
      >
        <StarLayer
          count={800}
          size={1}
          starColor={starColor}
          transition={{ repeat: Infinity, duration: speed, ease: 'linear' }}
        />

        <StarLayer
          count={300}
          size={2}
          starColor={starColor}
          transition={{
            repeat: Infinity,
            duration: speed * 2,
            ease: 'linear',
          }}
        />

        <StarLayer
          count={150}
          size={3}
          starColor={starColor}
          transition={{
            repeat: Infinity,
            duration: speed * 3,
            ease: 'linear',
          }}
        />
      </motion.div>

      {children}
    </div>
  );
}

export { StarLayer, StarsBackground };