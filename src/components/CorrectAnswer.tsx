import { motion } from 'framer-motion';

const CorrectAnswer = ({ points }) => {
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
        }}
      >
        {/* Animated confetti/stars in background */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
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
          className="flex flex-col items-center"
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
