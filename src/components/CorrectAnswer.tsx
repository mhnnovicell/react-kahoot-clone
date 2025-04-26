import { motion } from 'framer-motion';

const CorrectAnswer = ({ points }) => {
  // Create multiple firework locations (3 bursts)
  const fireworks = Array.from({ length: 3 }, (_, i) => i);

  // Function to generate random particles for each firework
  const generateParticles = (fireworkIndex) => {
    // Create 12 particles per firework
    return Array.from({ length: 12 }, (_, i) => {
      // Calculate random positions based on firework index
      const xPos =
        fireworkIndex === 0 ? '25%' : fireworkIndex === 1 ? '75%' : '50%';
      const yPos =
        fireworkIndex === 0 ? '30%' : fireworkIndex === 1 ? '30%' : '70%';

      // Random angle for particle trajectory
      const angle = (i / 12) * 360 + Math.random() * 30;
      const distance = 30 + Math.random() * 70; // Random distance

      // Random colors for particles
      const colors = [
        '#FFC107', // yellow
        '#E91E63', // pink
        '#03A9F4', // blue
        '#4CAF50', // green
        '#9C27B0', // purple
        '#FF5722', // orange
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: `${fireworkIndex}-${i}`,
        angle,
        distance,
        color,
        xPos,
        yPos,
        delay: fireworkIndex * 0.3 + Math.random() * 0.2,
        size: 4 + Math.random() * 6,
      };
    });
  };

  // Generate all particles for all fireworks
  const allParticles = fireworks.flatMap(generateParticles);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5 },
      }}
      className="w-full h-full"
    >
      <div
        className="w-full h-full p-6 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[80px] md:min-h-[100px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(to right bottom, #22c55e, #16a34a)',
          boxShadow:
            '0 8px 0 rgba(16, 128, 60, 0.7), 0 10px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Fireworks effect */}
        <div className="absolute inset-0 overflow-hidden">
          {allParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.xPos,
                top: particle.yPos,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 6px 1px ${particle.color}`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                x: `${Math.cos(particle.angle * (Math.PI / 180)) * particle.distance}px`,
                y: `${Math.sin(particle.angle * (Math.PI / 180)) * particle.distance}px`,
                scale: [0, 1, 0.5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: [0.2, 0.8, 0.4, 1],
                repeat: Infinity,
                repeatDelay: 3 + Math.random(),
              }}
            />
          ))}
        </div>

        {/* Animated confetti/stars in background - keep the existing effect */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute w-2 h-2 bg-white rounded-full"
              initial={{
                x: Math.random() * 100 - 50 + '%',
                y: Math.random() * 100 - 50 + '%',
                opacity: 0,
                scale: 0,
              }}
              animate={{
                y: [null, Math.random() * -50 - 10],
                opacity: [0, 1, 0],
                scale: [0, Math.random() * 0.8 + 0.5, 0],
                transition: {
                  duration: 1.5 + Math.random(),
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: i * 0.1,
                },
              }}
            />
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="z-10 flex flex-col items-center"
        >
          <span className="mb-1 text-xl font-extrabold text-white">
            KORREKT!
          </span>
          <motion.div
            className="flex items-center gap-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <span className="text-lg font-bold text-white">+{points}</span>
            <span className="text-2xl">🎉</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CorrectAnswer;
