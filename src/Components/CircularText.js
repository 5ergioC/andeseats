import { useEffect, useMemo } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import './CircularText.css';

const FULL_TURN = 360;

const getRotationTransition = (duration, from, loop = true) => ({
  from,
  to: from + FULL_TURN,
  ease: 'linear',
  duration,
  type: 'tween',
  repeat: loop ? Infinity : 0,
  repeatType: 'loop'
});

const getTransition = (duration, from) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring',
    damping: 20,
    stiffness: 300
  }
});

const CircularText = ({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
  size
}) => {
  const letters = useMemo(() => Array.from(text), [text]);
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const customSizeVars = useMemo(() => {
    if (!size) return {};
    const sizeValue = typeof size === 'number' ? `${size}px` : String(size);
    return { '--ct-size': sizeValue };
  }, [size]);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + FULL_TURN,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  }, [spinDuration, controls, rotation, text]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case 'speedUp':
        transitionConfig = getTransition(Math.max(spinDuration / 2, 0.1), start);
        break;
      case 'pause':
        transitionConfig = {
          rotate: { type: 'spring', damping: 20, stiffness: 300 },
          scale: { type: 'spring', damping: 20, stiffness: 300 }
        };
        scaleVal = 1;
        break;
      case 'goBonkers':
        transitionConfig = getTransition(Math.max(spinDuration / 8, 0.05), start);
        scaleVal = 0.85;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + FULL_TURN,
      scale: scaleVal,
      transition: transitionConfig
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + FULL_TURN,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  };

  if (letters.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`circular-text ${className}`}
      style={{
        rotate: rotation,
        ...customSizeVars
      }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const transform = [
          'translate(-50%, -50%)',
          `rotateZ(${rotationDeg}deg)`,
          `translate3d(0, calc(-1 * var(--ct-radius)), 0)`,
          `rotateZ(${180 - rotationDeg}deg)`
        ].join(' ');

        return (
          <span key={`${letter}-${i}`} style={{ transform, WebkitTransform: transform }}>
            {letter}
          </span>
        );
      })}
    </motion.div>
  );
};

export default CircularText;
