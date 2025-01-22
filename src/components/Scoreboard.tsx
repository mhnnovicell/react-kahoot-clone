import { useEffect, useState } from 'react';
import logo1 from '../assets/logo1.png';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

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
  const [playersList, setPlayersList] = useState([]);
  const { id } = useParams();
  const currentId = parseInt(id, 10);
  const navigate = useNavigate();

  useEffect(() => {
    setBackgroundColor(getRandomBackgroundColor());
  }, []);

  useEffect(() => {
    const checkAndFetchPlayers = async () => {
      // Fetch players from Supabase if not found in sessionStorage
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('points', { ascending: false });

      if (error) console.error('Error fetching scoreboard:', error);
      console.log(data, 'players');
      sessionStorage.setItem('players', JSON.stringify(data));
      setPlayersList(data);
    };

    checkAndFetchPlayers();

    const subscription = supabase
      .channel('players')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        (payload) => {
          console.log(payload, 'payload');
          checkAndFetchPlayers();
        },
      )
      .subscribe();

    const nextId = currentId + 1;

    window.setTimeout(() => {
      navigate(`/questions/${nextId}`);
    }, 6000);

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  console.log(playersList, 'playerslist');

  return (
    <>
      <div className="w-full h-full d-flex">
        <div className="flex items-center justify-center w-full h-full p-4">
          <h1 className="text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Quizazoid
          </h1>
          <img className="w-32 h-32 " src={logo1} alt="image description" />
        </div>

        <div className="flex flex-col items-center self-center justify-center w-full h-full p-6">
          <div
            className={`${backgroundColor} w-full p-6 flex flex-col  rounded-lg shadow`}
          >
            <h2 className="mb-4 text-5xl font-extrabold leading-none tracking-tight text-left text-gray-900 md:text-5xl lg:text-5xl dark:text-white">
              Scoreboard
            </h2>
            {playersList
              .sort((a, b) => b.points - a.points) // Sort players by points in descending order
              .map(function (data) {
                return (
                  <div
                    className="rounded-full w-3/5 my-1 flex justify-between items-center max-w-lg min-w-fit px-5 py-2.5 text-sm font-medium text-center text-white"
                    key={data.id}
                    style={{ backgroundColor: data.class }}
                  >
                    {data.name}
                    <span
                      className={`bg-slate-700 w-auto text-white inline-flex justify-center self-center items-center text-center text-sm font-extrabold px-3 rounded-full`}
                    >
                      {data.points}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
