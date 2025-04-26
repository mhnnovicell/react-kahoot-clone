import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Countdown({ onTimeExpired }) {
  const [seconds, setSeconds] = useState(60); // 60-second countdown

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (seconds === 0 && onTimeExpired) {
      onTimeExpired();
    }
  }, [seconds, onTimeExpired]);

  // Calculate progress for circular timer and color
  const progress = seconds / 60;
  const circumference = 2 * Math.PI * 45; // Circle radius = 45
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (seconds > 30) return 'from-green-500 to-green-600';
    if (seconds > 10) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="p-4 overflow-hidden shadow-lg rounded-xl bg-gradient-to-br from-indigo-900/90 to-purple-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Timer Title */}
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-white md:text-2xl">
              Tid tilbage
            </h3>
            <p className="text-sm text-purple-200">
              Svar hurtigt for flere point
            </p>
          </div>

          {/* Circular Timer */}
          <div className="relative flex items-center justify-center">
            <svg
              className="w-24 h-24 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#2A2550"
                strokeWidth="8"
              />

              {/* Progress circle with gradient */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={`url(#${seconds > 30 ? 'timerGradientGreen' : seconds > 10 ? 'timerGradientYellow' : 'timerGradientRed'})`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />

              {/* SVG Gradients */}
              <defs>
                <linearGradient
                  id="timerGradientGreen"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient
                  id="timerGradientYellow"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient
                  id="timerGradientRed"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
              </defs>
            </svg>

            {/* Timer Text */}
            <motion.div
              className="absolute flex flex-col items-center justify-center"
              animate={{
                scale: seconds < 10 ? [1, 1.1, 1] : 1,
              }}
              transition={{
                repeat: seconds < 10 ? Infinity : 0,
                duration: 0.8,
              }}
            >
              <motion.span
                className="text-3xl font-extrabold text-white md:text-4xl"
                key={seconds}
                initial={{ opacity: 0.8, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {seconds}
              </motion.span>
              <span className="text-xs text-purple-200">sekunder</span>
            </motion.div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 mt-3 overflow-hidden rounded-full bg-indigo-950/50">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${getTimerColor()}`}
            style={{ width: `${progress * 100}%` }}
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
