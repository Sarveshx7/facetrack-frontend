import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoodleIntroSceneProps {
  onComplete: () => void;
}

const DoodleIntroScene: React.FC<DoodleIntroSceneProps> = ({ onComplete }) => {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    // Scene progression
    const timers = [
      setTimeout(() => setScene(1), 1000),   // Doodles appear
      setTimeout(() => setScene(2), 2500),   // They notice each other
      setTimeout(() => setScene(3), 4000),   // Fight stance
      setTimeout(() => setScene(4), 5500),   // Fight!
      setTimeout(() => setScene(5), 7500),   // Make friends
      setTimeout(() => setScene(6), 9000),   // Happy together
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50 flex items-center justify-center overflow-hidden">
      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={onComplete}
        className="absolute top-8 right-8 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all text-gray-900 dark:text-white font-medium z-10"
      >
        Skip Intro →
      </motion.button>

      {/* Title */}
      <AnimatePresence>
        {scene >= 1 && scene < 6 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-20 text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              FaceTrackU
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {scene === 1 && "Meet the Team..."}
              {scene === 2 && "Uh oh... tension!"}
              {scene === 3 && "Ready to rumble!"}
              {scene === 4 && "FIGHT!"}
              {scene === 5 && "Wait... we're friends!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doodle Arena */}
      <div className="relative w-full max-w-4xl h-96">
        {/* Orange Blob - Left Fighter */}
        <motion.div
          initial={{ x: -500, opacity: 0 }}
          animate={{
            x: scene >= 1 ? (scene === 3 ? -50 : scene === 4 ? 50 : scene >= 5 ? 100 : 0) : -500,
            y: scene === 4 ? -20 : 0,
            rotate: scene === 3 ? -15 : scene === 4 ? 360 : scene >= 5 ? 0 : 0,
            scale: scene === 4 ? 1.2 : scene >= 5 ? 1 : 1,
            opacity: scene >= 1 ? 1 : 0
          }}
          transition={{ 
            duration: scene === 4 ? 0.5 : 1,
            type: 'tween',
            ease: 'easeInOut',
            repeat: scene === 4 ? 3 : 0,
            repeatType: 'reverse'
          }}
          className="absolute bottom-20 left-1/4 w-48 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-full shadow-2xl"
        >
          {/* Eyes */}
          <div className="relative w-full h-full flex items-center justify-center gap-3 mt-4">
            <motion.div 
              className="w-5 h-5 bg-white rounded-full flex items-center justify-center"
              animate={{
                scaleX: scene === 3 ? 0.7 : 1,
                x: scene === 2 ? 3 : scene === 3 ? 5 : 0
              }}
            >
              <div className="w-3 h-3 bg-black rounded-full" />
            </motion.div>
            <motion.div 
              className="w-5 h-5 bg-white rounded-full flex items-center justify-center"
              animate={{
                scaleX: scene === 3 ? 0.7 : 1,
                x: scene === 2 ? 3 : scene === 3 ? 5 : 0
              }}
            >
              <div className="w-3 h-3 bg-black rounded-full" />
            </motion.div>
          </div>
          {/* Mouth */}
          <motion.div
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
            animate={{
              rotate: scene === 3 ? 180 : scene >= 5 ? 0 : 0
            }}
          >
            <div className="w-8 h-4 border-b-4 border-black rounded-full" />
          </motion.div>
          {/* Fighting effects */}
          {scene === 4 && (
            <>
              <motion.div
                initial={{ scale: 0, x: 0 }}
                animate={{ scale: [0, 1.5, 0], x: [0, 30, 60] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="absolute right-0 top-1/2 w-8 h-8 bg-yellow-400 rounded-full opacity-70"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3, repeat: 6 }}
                className="absolute -right-4 top-1/3 text-4xl font-bold text-red-500"
              >
                💥
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Purple Rectangle - Right Fighter */}
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          animate={{
            x: scene >= 1 ? (scene === 3 ? 50 : scene === 4 ? -50 : scene >= 5 ? -100 : 0) : 500,
            y: scene === 4 ? -20 : 0,
            rotate: scene === 3 ? 15 : scene === 4 ? -360 : scene >= 5 ? 0 : 10,
            scale: scene === 4 ? 1.2 : scene >= 5 ? 1 : 1,
            opacity: scene >= 1 ? 1 : 0
          }}
          transition={{ 
            duration: scene === 4 ? 0.5 : 1,
            type: 'tween',
            ease: 'easeInOut',
            repeat: scene === 4 ? 3 : 0,
            repeatType: 'reverse'
          }}
          className="absolute bottom-20 right-1/4 w-28 h-52 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-2xl"
          style={{ transform: 'rotate(-10deg)' }}
        >
          {/* Eyes */}
          <div className="relative w-full h-full flex items-center justify-center gap-2 mt-8">
            <motion.div 
              className="w-4 h-4 bg-white rounded-full flex items-center justify-center"
              animate={{
                scaleX: scene === 3 ? 0.7 : 1,
                x: scene === 2 ? -3 : scene === 3 ? -5 : 0
              }}
            >
              <div className="w-2 h-2 bg-black rounded-full" />
            </motion.div>
            <motion.div 
              className="w-4 h-4 bg-white rounded-full flex items-center justify-center"
              animate={{
                scaleX: scene === 3 ? 0.7 : 1,
                x: scene === 2 ? -3 : scene === 3 ? -5 : 0
              }}
            >
              <div className="w-2 h-2 bg-black rounded-full" />
            </motion.div>
          </div>
          {/* Mouth */}
          <motion.div
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
            animate={{
              rotate: scene === 3 ? 180 : scene >= 5 ? 0 : 0
            }}
          >
            <div className="w-6 h-3 border-b-3 border-white rounded-full" />
          </motion.div>
          {/* Fighting effects */}
          {scene === 4 && (
            <>
              <motion.div
                initial={{ scale: 0, x: 0 }}
                animate={{ scale: [0, 1.5, 0], x: [0, -30, -60] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="absolute left-0 top-1/2 w-8 h-8 bg-blue-400 rounded-full opacity-70"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3, repeat: 6, delay: 0.15 }}
                className="absolute -left-4 top-1/3 text-4xl font-bold text-red-500"
              >
                💥
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Dark & Yellow - Spectators */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: scene >= 2 ? 0 : 100,
            opacity: scene >= 2 ? 1 : 0,
            x: scene === 4 ? 5 : 0
          }}
          transition={{
            duration: 0.2,
            repeat: scene === 4 ? 8 : 0,
            repeatType: 'reverse'
          }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-8"
        >
          {/* Dark - Watching */}
          <div className="w-24 h-28 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl shadow-xl">
            <div className="relative w-full h-full flex items-center justify-center gap-2 mt-6">
              <motion.div 
                className="w-4 h-4 bg-white rounded-full"
                animate={{
                  x: scene === 4 ? 2 : 0
                }}
                transition={{
                  duration: 0.15,
                  repeat: scene === 4 ? 10 : 0,
                  repeatType: 'reverse'
                }}
              >
                <div className="w-2 h-2 bg-black rounded-full mx-auto mt-1" />
              </motion.div>
              <motion.div 
                className="w-4 h-4 bg-white rounded-full"
                animate={{
                  x: scene === 4 ? 2 : 0
                }}
                transition={{
                  duration: 0.15,
                  repeat: scene === 4 ? 10 : 0,
                  repeatType: 'reverse'
                }}
              >
                <div className="w-2 h-2 bg-black rounded-full mx-auto mt-1" />
              </motion.div>
            </div>
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-5 h-2 border-b-2 border-white rounded-full" />
          </div>

          {/* Yellow - Watching */}
          <div className="w-16 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-xl">
            <div className="relative w-full h-full flex items-center justify-center gap-1 mt-8">
              <motion.div 
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  x: scene === 4 ? -2 : 0
                }}
                transition={{
                  duration: 0.15,
                  repeat: scene === 4 ? 10 : 0,
                  repeatType: 'reverse'
                }}
              >
                <div className="w-2 h-2 bg-black rounded-full mx-auto" />
              </motion.div>
              <motion.div 
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  x: scene === 4 ? -2 : 0
                }}
                transition={{
                  duration: 0.15,
                  repeat: scene === 4 ? 10 : 0,
                  repeatType: 'reverse'
                }}
              >
                <div className="w-2 h-2 bg-black rounded-full mx-auto" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Hearts when they become friends */}
        {scene >= 5 && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 1],
                  y: [0, -100, -200],
                  opacity: [1, 1, 0],
                  x: [0, (i % 2 === 0 ? 20 : -20)]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute bottom-32 left-1/2 text-4xl"
              >
                ❤️
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Final message and transition */}
      <AnimatePresence>
        {scene === 6 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center"
          >
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Welcome to FaceTrackU! 🎉
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Where everyone works together!
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onComplete}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
            >
              Let's Get Started! →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoodleIntroScene;
