import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DoodleCharacterProps {
  color: string;
  shape: 'blob' | 'rectangle' | 'rounded' | 'pill';
  size: number;
  position: { bottom: number; left: number; zIndex?: number };
  mousePos: { x: number; y: number };
  isPasswordFocused: boolean;
  isUsernameFocused: boolean;
  isPasswordVisible: boolean;
  isWrongPassword: boolean;
  isHappy: boolean;
  isLoginSuccess: boolean;
  delay: number;
  personality?: 'energetic' | 'shy' | 'calm' | 'curious';
  onInteraction?: () => void;
}

const DoodleCharacter: React.FC<DoodleCharacterProps> = ({
  color,
  shape,
  size,
  position,
  mousePos,
  isPasswordFocused,
  isUsernameFocused,
  isPasswordVisible,
  isWrongPassword,
  isHappy,
  isLoginSuccess,
  delay,
  personality = 'calm',
  onInteraction
}) => {
  const characterRef = useRef<HTMLDivElement>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleOffset, setIdleOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [breathingScale, setBreathingScale] = useState(1);
  const [eyebrowOffset, setEyebrowOffset] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);

  // Personality-based blink timing
  const getBlinkInterval = () => {
    switch(personality) {
      case 'energetic': return 2000 + Math.random() * 1000; // 2-3s
      case 'shy': return 4000 + Math.random() * 2000; // 4-6s
      case 'calm': return 3500 + Math.random() * 1500; // 3.5-5s
      case 'curious': return 2500 + Math.random() * 1500; // 2.5-4s
      default: return 3000 + Math.random() * 2000;
    }
  };

  // Blink animation - random blinks with personality
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    
    const blinkInterval = setInterval(blink, getBlinkInterval());
    return () => clearInterval(blinkInterval);
  }, [personality]);

  // Idle animation - personality-based sway
  useEffect(() => {
    const getSwayAmount = () => {
      switch(personality) {
        case 'energetic': return 3;
        case 'shy': return 1;
        case 'calm': return 1.5;
        case 'curious': return 2.5;
        default: return 2;
      }
    };

    const idleInterval = setInterval(() => {
      const swayAmount = getSwayAmount();
      const speed = personality === 'energetic' ? 1.5 : personality === 'calm' ? 0.7 : 1;
      setIdleOffset(Math.sin(Date.now() / 1000 * speed) * swayAmount);
    }, 50);

    return () => clearInterval(idleInterval);
  }, [personality]);

  // Breathing effect - very subtle
  useEffect(() => {
    const breathingInterval = setInterval(() => {
      const breathSpeed = personality === 'energetic' ? 1.2 : 0.8;
      setBreathingScale(1 + Math.sin(Date.now() / 2000 * breathSpeed) * 0.01); // Reduced from 0.02 to 0.01
    }, 50);
    return () => clearInterval(breathingInterval);
  }, [personality]);

  // Eyebrow movement based on emotion
  useEffect(() => {
    if (isWrongPassword) {
      setEyebrowOffset(3); // Sad eyebrows
    } else if (isHappy || isLoginSuccess) {
      setEyebrowOffset(-2); // Happy eyebrows
    } else if (isHovered) {
      setEyebrowOffset(-1); // Curious eyebrows
    } else {
      setEyebrowOffset(0);
    }
  }, [isWrongPassword, isHappy, isLoginSuccess, isHovered]);

  // Success particles
  useEffect(() => {
    if (isLoginSuccess || isHappy) {
      // Create particles with proper x, y coordinates
      const newParticles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return {
          id: Date.now() + i,
          x: Math.cos(angle) * 50,
          y: Math.sin(angle) * 50
        };
      });
      setParticles(newParticles);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 1000);
    }
  }, [isLoginSuccess, isHappy]);

  // Debug: Log when wrong password state changes
  useEffect(() => {
    if (isWrongPassword) {
      console.log(' Doodle received isWrongPassword=true - should shake now!');
    }
  }, [isWrongPassword]);

  // Wave animation handler
  const handleClick = () => {
    if (!isWaving) {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 600);
      onInteraction?.();
    }
  };

  useEffect(() => {
    if (characterRef.current && !isPasswordFocused && !isPasswordVisible) {
      const rect = characterRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(mousePos.y - (centerY - rect.top), mousePos.x - (centerX - rect.left));
      const distance = Math.min(size * 0.1, 8);
      
      setEyePosition({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    } else if (isPasswordFocused || isPasswordVisible) {
      // Look away to the left when password is focused or visible
      setEyePosition({ x: -8, y: 0 });
    }
  }, [mousePos, isPasswordFocused, isPasswordVisible, size]);

  const getShapeClass = () => {
    switch (shape) {
      case 'blob':
        return 'rounded-t-full'; // Semi-circle top
      case 'rectangle':
        return 'rounded-lg';
      case 'rounded':
        return 'rounded-2xl';
      case 'pill':
        return 'rounded-full';
      default:
        return 'rounded-lg';
    }
  };

  const getShapeStyle = () => {
    switch (shape) {
      case 'blob':
        return { width: size, height: size * 0.7 }; // Semi-circle
      case 'rectangle':
        return { width: size * 0.6, height: size * 1.4, transform: 'rotate(-10deg)' }; // Tilted
      case 'rounded':
        return { width: size * 0.7, height: size * 0.9 };
      case 'pill':
        return { width: size * 0.5, height: size * 1.1 }; // Tall thin pill
      default:
        return { width: size, height: size };
    }
  };

  return (
    <motion.div
      ref={characterRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ 
        opacity: 0, 
        y: 100,
        scale: 0.5
      }}
      animate={{
        opacity: 1,
        y: isLoginSuccess 
          ? [0, -30, -20, -30, 0]
          : isUsernameFocused ? [0, -10, 0] : 0,
        scale: isLoginSuccess
          ? [1, 1.15, 1.1, 1.15, 1]
          : isUsernameFocused ? [1, 1.05, 1] : (isHovered ? 1.03 : 1) * breathingScale,
        rotate: isWaving
          ? [0, -15, 15, -15, 15, 0]
          : isLoginSuccess
          ? [0, -10, 10, -10, 10, 0]
          : isWrongPassword ? [0, -15, 15, -15, 15, 0] : idleOffset,
        x: isWaving ? [0, -5, 5, -5, 5, 0] : idleOffset
      }}
      transition={{
        opacity: { delay, duration: 0.3 },
        y: isUsernameFocused
          ? { duration: 0.4, ease: 'easeOut' }
          : { 
              delay, 
              type: 'spring', 
              stiffness: 300, 
              damping: 15,
              mass: 0.8
            },
        scale: isUsernameFocused
          ? { duration: 0.4, ease: 'easeOut' }
          : { 
              delay, 
              type: 'spring', 
              stiffness: 400, 
              damping: 20 
            },
        rotate: isWrongPassword || isWaving || isLoginSuccess
          ? { duration: 0.6, ease: 'easeInOut', times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
          : { duration: 0.5, ease: 'easeInOut' }
      }}
      className={`absolute ${getShapeClass()} cursor-pointer transition-all duration-300`}
      style={{
        backgroundColor: color,
        bottom: position.bottom,
        left: position.left,
        zIndex: position.zIndex || 0,
        boxShadow: isHovered 
          ? `0 10px 30px rgba(0,0,0,0.3), 0 0 20px ${color}80`
          : '0 4px 10px rgba(0,0,0,0.1)',
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
        ...getShapeStyle()
      }}
    >
      {/* Success Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: 0, 
            scale: 1.5,
            x: particle.x,
            y: particle.y
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
          style={{
            backgroundColor: isHappy ? '#FFD700' : '#FFF',
            boxShadow: '0 0 10px currentColor'
          }}
        />
      ))}
      {/* Eyes - Realistic with white eyeballs and emotions */}
      <div 
        className="relative w-full h-full flex items-center justify-center gap-4"
        style={{
          marginTop: shape === 'rectangle' ? '-20px' : '0px'
        }}
      >
        {/* Left Eyebrow */}
        <motion.div
          className="absolute"
          style={{
            top: shape === 'rectangle' ? '20%' : shape === 'blob' ? '35%' : '28%',
            left: shape === 'blob' ? '32%' : '35%',
            width: shape === 'blob' ? '12px' : '10px',
            height: '2px',
            backgroundColor: shape === 'blob' ? '#000' : '#FFF',
            borderRadius: '2px',
            opacity: 0.6
          }}
          animate={{
            y: eyebrowOffset,
            rotate: isWrongPassword ? 10 : isHappy ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Right Eyebrow */}
        <motion.div
          className="absolute"
          style={{
            top: shape === 'rectangle' ? '20%' : shape === 'blob' ? '35%' : '28%',
            right: shape === 'blob' ? '32%' : '35%',
            width: shape === 'blob' ? '12px' : '10px',
            height: '2px',
            backgroundColor: shape === 'blob' ? '#000' : '#FFF',
            borderRadius: '2px',
            opacity: 0.6
          }}
          animate={{
            y: eyebrowOffset,
            rotate: isWrongPassword ? -10 : isHappy ? 5 : 0
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Left Eye */}
        <motion.div 
          className="bg-white rounded-full relative shadow-inner flex items-center justify-center overflow-hidden"
          animate={{
            width: isWrongPassword ? 18 : isHappy || isLoginSuccess ? 24 : 20,
            height: isBlinking ? 2 : (isWrongPassword ? 18 : isHappy || isLoginSuccess ? 24 : 20),
            y: isWrongPassword ? 3 : 0
          }}
          transition={{ 
            duration: isBlinking ? 0.1 : 0.3, 
            type: 'spring', 
            stiffness: 300 
          }}
        >
          <motion.div
            className="bg-black rounded-full"
            animate={{
              x: eyePosition.x,
              y: eyePosition.y,
              width: isWrongPassword ? 8 : isHappy ? 12 : 10,
              height: isWrongPassword ? 8 : isHappy ? 12 : 10
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 250, 
              damping: 25,
              mass: 0.5
            }}
          />
          {/* Sparkle in eye when happy */}
          {isHappy && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"
            />
          )}
        </motion.div>
        {/* Right Eye */}
        <motion.div 
          className="bg-white rounded-full relative shadow-inner flex items-center justify-center overflow-hidden"
          animate={{
            width: isWrongPassword ? 18 : isHappy || isLoginSuccess ? 24 : 20,
            height: isBlinking ? 2 : (isWrongPassword ? 18 : isHappy || isLoginSuccess ? 24 : 20),
            y: isWrongPassword ? 3 : 0
          }}
          transition={{ 
            duration: isBlinking ? 0.1 : 0.3, 
            type: 'spring', 
            stiffness: 300 
          }}
        >
          <motion.div
            className="bg-black rounded-full"
            animate={{
              x: eyePosition.x,
              y: eyePosition.y,
              width: isWrongPassword ? 8 : isHappy ? 12 : 10,
              height: isWrongPassword ? 8 : isHappy ? 12 : 10
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 250, 
              damping: 25,
              mass: 0.5
            }}
          />
          {/* Sparkle in eye when happy */}
          {isHappy && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full"
            />
          )}
        </motion.div>
      </div>
      
      {/* Mouth - changes based on emotion with smooth transitions */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{
          bottom: shape === 'rectangle' ? '30%' : '2rem'
        }}
        animate={{
          y: isWrongPassword ? 2 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {shape === 'blob' && (
          isWrongPassword ? (
            /* Sad mouth - deep frown */
            <motion.div 
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 1 }}
              className="relative"
            >
              <div className="w-6 h-3 border-t-[3px] border-black rounded-full" />
              {/* Sad tears effect */}
              <div className="absolute -left-1 -top-2 w-1 h-1 bg-black rounded-full opacity-50" />
            </motion.div>
          ) : isHappy ? (
            /* Happy mouth - big excited smile */
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-6 h-3 border-b-[3px] border-black rounded-full" />
              {/* Dimples */}
              <div className="absolute -left-2 top-1 w-1.5 h-1 bg-black/20 rounded-full" />
              <div className="absolute -right-2 top-1 w-1.5 h-1 bg-black/20 rounded-full" />
            </motion.div>
          ) : (
            /* Normal mouth - content smile */
            <div className="w-4 h-2 border-b-2 border-black rounded-full" />
          )
        )}
        {shape === 'rounded' && (
          isWrongPassword ? (
            /* Sad mouth - deep frown */
            <div className="w-5 h-2.5 border-t-[3px] border-white rounded-full" />
          ) : isHappy ? (
            /* Happy mouth - big smile */
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-5 h-2.5 border-b-[3px] border-white rounded-full" />
            </motion.div>
          ) : (
            /* Normal mouth */
            <div className="w-3 h-1.5 border-b-2 border-white rounded-full" />
          )
        )}
        {shape === 'rectangle' && (
          isWrongPassword ? (
            /* Sad mouth - deep frown */
            <div className="w-5 h-2.5 border-t-[3px] border-white rounded-full" />
          ) : isHappy ? (
            /* Happy mouth - big smile */
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-5 h-2.5 border-b-[3px] border-white rounded-full" />
            </motion.div>
          ) : (
            /* Normal mouth */
            <div className="w-3 h-1.5 border-b-2 border-white rounded-full" />
          )
        )}
      </motion.div>
      
      {/* Beak for yellow character */}
      {shape === 'pill' && (
        <div className="absolute bottom-1/3 right-0 w-6 h-1 bg-black" style={{ borderRadius: '2px' }} />
      )}
    </motion.div>
  );
};

export default DoodleCharacter;
