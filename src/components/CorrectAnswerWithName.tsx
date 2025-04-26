import { motion } from 'framer-motion';

const CorrectAnswerWithName = ({ name }) => {
  // Create multiple firework locations
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
        '#FFC107',
        '#E91E63',
        '#03A9F4',
        '#4CAF50',
        '#9C27B0',
        '#FF5722',
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
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
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
                repeat: Infinity, // Makes the fireworks continuous
                repeatDelay: 3 + Math.random(),
              }}
            />
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="z-10 flex items-center gap-3"
        >
          <motion.div
            className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-white/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, 0] }}
            transition={{
              scale: { delay: 0.3, type: 'spring', stiffness: 200 },
              rotate: { delay: 0.4, duration: 0.5 },
            }}
          >
            <span className="text-lg">✓</span>
          </motion.div>

          <div className="flex-1">
            <motion.div
              className="overflow-hidden text-xl font-extrabold tracking-tight text-white overflow-ellipsis"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              {name}
            </motion.div>
            <motion.div
              className="text-sm font-medium text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Korrekt svar
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CorrectAnswerWithName;
