import { motion } from 'framer-motion';

export default function WrongAnswer() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3, ease: 'circIn' }}
      className="flex w-full h-full mt-1.5 flex-nowrap"
    >
      <div className="w-full h-full p-4 text-lg font-extrabold leading-none tracking-tight text-center text-white bg-red-700 rounded-lg shadow lg:text-3xl lg:p-20 lg:m-4 whitespace-nowrap">
        <span className="mr-1">Forkert</span>
        <span>&#128546;</span>
      </div>
    </motion.div>
  );
}
