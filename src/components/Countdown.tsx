import React, { useState, useEffect } from 'react';

export default function Countdown() {
  const [seconds, setSeconds] = useState(60); // Set initial countdown value

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  return (
    <div className='flex flex-col items-center self-center justify-center w-full gap-4 count-down-main'>
      <div className='flex flex-col w-16 timer'>
        <h2 className='my-10 text-2xl font-extrabold leading-none tracking-tight text-left text-gray-900 dark:text-white'>
          Sekunder:
        </h2>
        <div className='px-2 py-4 overflow-hidden bg-indigo-600 rounded-lg'>
          <h3
            className={`text-2xl font-semibold text-center text-white countdown-element seconds font-Cormorant ${
              seconds > 0 ? 'animate-countinsecond' : 'animate-none'
            }`}
          >
            {seconds}
          </h3>
        </div>
      </div>
    </div>
  );
}
