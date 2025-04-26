import { motion } from 'framer-motion';

export default function WrongAnswer() {
  // Create positions for X marks
  const xMarks = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Random X position (%)
    y: Math.random() * 100, // Random Y position (%)
    size: Math.random() * 10 + 8, // Size between 8-18px
    delay: Math.random() * 1.5, // Random delay
    duration: 0.6 + Math.random() * 0.8, // Duration between 0.6-1.4s
    opacity: Math.random() * 0.4 + 0.15, // Opacity between 0.15-0.55
    rotation: Math.random() * 30 - 15, // Random slight rotation
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <motion.div
        className="w-full h-full p-6 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[80px] md:min-h-[100px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(to right bottom, #ef4444, #b91c1c)',
          boxShadow:
            '0 8px 0 rgba(153, 27, 27, 0.7), 0 10px 20px rgba(0, 0, 0, 0.3)',
        }}
        animate={{
          x: [0, -5, 5, -5, 5, 0],
          transition: {
            duration: 0.5,
            delay: 0.2,
          },
        }}
      >
        {/* X marks animation effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {xMarks.map((mark) => (
            <motion.div
              key={mark.id}
              className="absolute"
              style={{
                left: `${mark.x}%`,
                top: `${mark.y}%`,
                width: mark.size,
                height: mark.size,
                opacity: 0,
                rotate: mark.rotation,
              }}
              animate={{
                opacity: [0, mark.opacity, 0],
                scale: [0.5, 1.2, 0.8],
              }}
              transition={{
                duration: mark.duration,
                delay: mark.delay,
                repeat: Infinity,
                repeatDelay: 1 + Math.random() * 2,
              }}
            >
              {/* X mark */}
              <div className="relative w-full h-full">
                <div className="absolute w-full h-0.5 bg-white/80 top-1/2 -translate-y-1/2 rotate-45"></div>
                <div className="absolute w-full h-0.5 bg-white/80 top-1/2 -translate-y-1/2 -rotate-45"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error highlight flashes */}
        <motion.div
          className="absolute inset-0 pointer-events-none bg-white/10"
          animate={{
            opacity: [0, 0.15, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: 3,
            repeatDelay: 0.2,
            delay: 0.1,
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="z-10 flex flex-col items-center justify-center gap-2"
        >
          <motion.div
            className="relative flex items-center justify-center w-10 h-10"
            initial={{ rotate: -90, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {/* X mark icon */}
            <motion.div
              className="relative w-full h-full"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                repeat: 2,
                duration: 0.5,
                delay: 0.5,
                repeatType: 'reverse',
              }}
            >
              <div className="absolute w-full h-1.5 bg-white rounded-full top-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute w-full h-1.5 bg-white rounded-full top-1/2 -translate-y-1/2 -rotate-45"></div>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-xl font-extrabold tracking-tight text-center text-white"
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            FORKERT
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
