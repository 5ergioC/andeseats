import { useCallback, useEffect, useMemo, useRef } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import './CircularText.css';

const FULL_TURN = 360;
const MIN_DURATION = 0.1;

const CircularText = ({
  text,
  spinDuration = 20,
  onHover = 'slowDown',
  className = '',
  size
}) => {
  const letters = useMemo(() => Array.from(text), [text]);
  const rotation = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotationAnimation = useRef(null);
  const scaleAnimation = useRef(null);

  const customSizeVars = useMemo(() => {
    if (!size) return {};
    const sizeValue = typeof size === 'number' ? `${size}px` : String(size);
    return { '--ct-size': sizeValue };
  }, [size]);

  const stopSpin = useCallback(() => {
    rotationAnimation.current?.stop();
    rotationAnimation.current = null;
  }, []);

  const startSpin = useCallback(
    (duration) => {
      const start = rotation.get();
      const resolvedDuration = Math.max(duration, MIN_DURATION);
      rotationAnimation.current?.stop();
      rotationAnimation.current = animate(rotation, start + FULL_TURN, {
        ease: 'linear',
        duration: resolvedDuration,
        repeat: Infinity,
        repeatType: 'loop'
      });
    },
    [rotation]
  );

  const animateScale = useCallback(
    (value) => {
      scaleAnimation.current?.stop();
      scaleAnimation.current = animate(scale, value, {
        type: 'spring',
        damping: 20,
        stiffness: 300
      });
    },
    [scale]
  );

  useEffect(() => {
    startSpin(spinDuration);
    return () => {
      stopSpin();
      scaleAnimation.current?.stop();
    };
  }, [spinDuration, startSpin, stopSpin, letters.length]);

  const handleHoverStart = () => {
    if (!onHover) return;

    let targetDuration = spinDuration;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        targetDuration = spinDuration * 2;
        break;
      case 'speedUp':
        targetDuration = Math.max(spinDuration / 2, MIN_DURATION);
        break;
      case 'pause':
        stopSpin();
        animateScale(1);
        return;
      case 'goBonkers':
        targetDuration = Math.max(spinDuration / 8, MIN_DURATION);
        scaleVal = 0.85;
        break;
      default:
        targetDuration = spinDuration;
    }

    startSpin(targetDuration);
    animateScale(scaleVal);
  };

  const handleHoverEnd = () => {
    stopSpin();
    animateScale(1);
    startSpin(spinDuration);
  };

  if (letters.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`circular-text ${className}`}
      style={{
        rotate: rotation,
        scale,
        ...customSizeVars
      }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const transform = [
          'translate(-50%, -50%)',
          `rotateZ(${rotationDeg}deg)`,
          `translateY(calc(-1 * var(--ct-radius)))`
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
