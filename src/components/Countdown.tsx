import { useState, useEffect } from 'react';

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

  const progressBarWidth = (seconds / 60) * 100; // Calculate progress bar width

  return (
    <>
      <div
        id="countdown"
        className="z-50 flex items-center justify-center w-full p-2 mt-3 text-gray-400 bg-gray-800 divide-x divide-gray-700 rounded-lg shadow flex-nowrap"
        role="alert"
      >
        <div className="flex items-center justify-center text-sm font-normal text-center">
          <p className="mb-0 text-lg font-medium leading-none tracking-tight text-left text-white md:text-2xl">
            Sekunder:
          </p>
          <h3
            className={`text-2xl ml-2 font-extrabold text-white text-center countdown-element seconds font-Cormorant ${
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
