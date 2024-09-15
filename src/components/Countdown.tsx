import React, { useState, useEffect } from 'react';

export default function Countdown() {
  const [seconds, setSeconds] = useState(60); // Set initial countdown value

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const progressBarWidth = (seconds / 60) * 100; // Calculate progress bar width

  return (
    <>
      <div
        id="toast-bottom-right"
        className="fixed flex items-center justify-center w-1/3 max-w-xs p-4 space-x-4 text-gray-400 bg-gray-800 divide-x divide-gray-700 rounded-lg shadow rtl:divide-x-reverse right-5 bottom-5"
        role="alert"
      >
        <div className="text-sm font-normal">
          <p className="mb-2 text-lg font-medium leading-none tracking-tight text-left text-white md:text-2xl ">
            Sekunder:
          </p>
          <h3
            className={`text-2xl font-extrabold text-white text-center countdown-element seconds font-Cormorant ${
              seconds > 0 ? 'animate-countinsecond' : 'animate-none'
            }`}
          >
            {seconds}
          </h3>
        </div>
      </div>
    </>
  );
}
