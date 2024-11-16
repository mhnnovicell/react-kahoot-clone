import { useEffect, useState, lazy } from 'react';
import logo1 from '../assets/logo1.png';
import { useParams, useNavigate } from 'react-router-dom';

const backgroundColors = [
  'bg-gradient-to-r from-cyan-500 to-blue-500',
  'bg-gradient-to-r from-sky-500 to-indigo-500',
  'bg-gradient-to-r from-violet-500 to-fuchsia-500',
  'bg-gradient-to-r from-purple-500 to-pink-500',
  'bg-gradient-to-r from-teal-500 to-indigo-500',
  'bg-gradient-to-r from-indigo-500 to-sky-500',
  'bg-gradient-to-r from-rose-500 to-fuchsia-500',
  'bg-gradient-to-r from-lime-500 to-emerald-500',
  'bg-gradient-to-r from-red-500 to-orange-500',
];

const getRandomBackgroundColor = () => {
  const randomIndex = Math.floor(Math.random() * backgroundColors.length);
  return backgroundColors[randomIndex];
};

export default function Scoreboard() {
  const [backgroundColor, setBackgroundColor] = useState('');

  useEffect(() => {
    setBackgroundColor(getRandomBackgroundColor());
  }, []);

  const { id } = useParams();
  const currentId = parseInt(id, 10);

  const handleClick = () => {
    const nextId = currentId + 1;
    navigate(`/scoreboard/${nextId}`);
  };

  return (
    <>
      <div className="flex items-center justify-center w-full h-screen p-6 mb-4">
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          Quizazoid
        </h1>
        <img className="w-32 h-32 " src={logo1} alt="image description" />
      </div>

      <div className="flex flex-col items-center self-center justify-center w-full h-screen p-6">
        <h2 className="my-4 text-4xl font-extrabold leading-none tracking-tight text-left text-gray-900 md:text-5xl lg:text-5xl dark:text-white">
          Scoreboard
        </h2>
        <div className="relative flex items-center justify-center w-full mt-6 overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full text-sm text-left text-white ">
            <thead
              className={`text-xs text-white font-bold uppercase ${backgroundColor} border-b `}
            >
              <tr>
                <th scope="col" className="px-6 py-3">
                  Spillere
                </th>
                <th scope="col" className="px-6 py-3">
                  Point
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={`${backgroundColor} border-b`}>
                <td className="w-1/2 px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  Spilelr navn
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center mt-4">
                    <span className="text-sm font-bold text-white">1000</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
