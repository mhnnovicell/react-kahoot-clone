import { motion } from 'framer-motion';

const CorrectAnswerWithName = ({ name }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: 'circIn' }}
      className="flex w-full h-full mt-1.5 flex-nowrap items-center self-center justify-center"
    >
      <div className="w-full h-full p-4 text-lg font-extrabold leading-none tracking-tight text-center text-white bg-green-700 rounded-lg shadow lg:text-3xl lg:p-20 lg:m-4 whitespace-nowrap">
        <span className="mr-1">{name}</span>
        <span>✅</span>
      </div>
    </motion.div>
  );
};

export default CorrectAnswerWithName;
