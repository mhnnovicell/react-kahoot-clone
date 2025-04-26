import { motion } from 'framer-motion';

const CorrectAnswerWithName = ({ name }) => {
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
