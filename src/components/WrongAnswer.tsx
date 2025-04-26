import { motion } from 'framer-motion';

export default function WrongAnswer() {
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
          background: 'linear-gradient(to right bottom, #ef4444, #b91c1c)',
          boxShadow:
            '0 8px 0 rgba(153, 27, 27, 0.7), 0 10px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* X pattern in background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`x-${i}`}
              className="absolute top-0 bottom-0 w-px bg-white left-1/2"
              style={{
                transform: `translateX(${i * 20 - 40}px) rotate(${30 - i * 15}deg)`,
                transformOrigin: 'center',
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`y-${i}`}
              className="absolute left-0 right-0 h-px bg-white top-1/2"
              style={{
                transform: `translateY(${i * 20 - 40}px) rotate(${30 - i * 15}deg)`,
                transformOrigin: 'center',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            />
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="z-10 flex flex-col items-center justify-center gap-2"
        >
          <motion.div
            className="relative w-8 h-8"
            initial={{ rotate: -90 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.span
              className="absolute inset-0 flex items-center justify-center text-2xl"
              animate={{
                scale: [1, 1.2, 1],
                transition: {
                  repeat: 2,
                  duration: 0.5,
                  delay: 0.5,
                  repeatType: 'reverse',
                },
              }}
            >
              😕
            </motion.span>
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
      </div>
    </motion.div>
  );
}
