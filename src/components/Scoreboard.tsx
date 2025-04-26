import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
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

const CountUp = ({ start, end }) => {
  const controls = useAnimation();
  const [value, setValue] = useState(start);

  useEffect(() => {
    // Skip animation if start and end values are the same
    if (start === end) {
      setValue(end);
      return;
    }

    controls.start({
      value: end,
      transition: { duration: 2, ease: 'easeInOut', delay: 1 },
    });
  }, [end, controls, start]);

  return (
    <motion.span
      animate={controls}
      initial={{ value: start }}
      onUpdate={(latest) => setValue(latest.value.toFixed(0))}
    >
      {value}
    </motion.span>
  );
};

const Player = ({ data }) => {
  // Calculate points earned in this round
  const pointsEarnedThisRound = data.points - (data.previousPoints || 0);

  return (
    <motion.div
      layout
      className="rounded-full w-3/5 my-1 flex justify-between items-center max-w-lg min-w-fit px-5 py-2.5 text-sm font-medium text-center text-white"
      key={data.id}
      style={{ backgroundColor: data.class }}
    >
      {data.name}
      <div className="flex items-center gap-2">
        <span
          className={`bg-slate-700 w-auto text-white inline-flex justify-center self-center items-center text-center text-sm font-extrabold px-3 rounded-full ml-2`}
        >
          {pointsEarnedThisRound > 0 ? (
            <CountUp
              start={data.points - pointsEarnedThisRound}
              end={data.points}
            />
          ) : (
            data.points
          )}
        </span>
        {pointsEarnedThisRound > 0 && (
          <span className="text-xs font-bold text-white">
            +{pointsEarnedThisRound}
          </span>
        )}
        {pointsEarnedThisRound === 0 && (
          <span className="text-xs font-bold text-black">+0</span>
        )}
      </div>
    </motion.div>
  );
};

export default function Scoreboard() {
  const [backgroundColor, setBackgroundColor] = useState(
    getRandomBackgroundColor,
  );
  const [playersList, setPlayersList] = useState([]);
  const [allPlayersPresent, setAllPlayersPresent] = useState(false);
  const { id } = useParams();
  const currentId = parseInt(id, 10);
  const navigate = useNavigate();

  // Update current player's status to show they're on the scoreboard
  useEffect(() => {
    const updatePlayerStatus = async () => {
      // Get current player info from sessionStorage
      const players = JSON.parse(sessionStorage.getItem('players')) || [];
      if (players.length > 0) {
        // Update the current player's status in Supabase
        const { error } = await supabase
          .from('players')
          .update({ onScoreboard: true, currentQuestionId: currentId })
          .eq('id', players[0].id); // Assuming the first player is the current user

        if (error) console.error('Error updating player status:', error);
      }
    };

    updatePlayerStatus();
  }, [currentId]);

  const checkAndFetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('points', { ascending: false });

    if (error) console.error('Error fetching scoreboard:', error);

    // Store players data
    sessionStorage.setItem('players', JSON.stringify(data));
    setPlayersList(data);

    // Check if all active players are on this scoreboard
    const activePlayers = data.filter((player) => player.hasBeenAdded);
    const playersOnScoreboard = data.filter(
      (player) =>
        player.hasBeenAdded &&
        player.onScoreboard &&
        player.currentQuestionId === currentId,
    );

    if (
      activePlayers.length > 0 &&
      activePlayers.length === playersOnScoreboard.length
    ) {
      setAllPlayersPresent(true);
    }
  }, [currentId]);

  useEffect(() => {
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
          checkAndFetchPlayers();
        },
      )
      .subscribe();

    // Only set up the timer for navigation when all players are present
    let timeoutId;
    if (allPlayersPresent) {
      console.log(allPlayersPresent, 'allPlayersPresent');
      const nextId = currentId + 1;
      timeoutId = window.setTimeout(() => {
        // Reset onScoreboard status for all players before navigating
        const resetPlayers = async () => {
          const { error } = await supabase
            .from('players')
            .update({ onScoreboard: false })
            .eq('currentQuestionId', currentId);

          if (error) console.error('Error resetting player status:', error);
          navigate(`/questions/${nextId}`);
        };

        resetPlayers();
      }, 7000);
    }

    return () => {
      supabase.removeChannel(subscription);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkAndFetchPlayers, currentId, navigate, allPlayersPresent]);

  return (
    <div className="w-full h-full d-flex">
      <div className="flex items-center justify-center w-full h-full p-4">
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          Quizazoid
        </h1>
        <img className="w-32 h-32 " src={logo1} alt="image description" />
      </div>

      <div className="flex flex-col items-center self-center justify-center w-full h-full p-6">
        <div
          className={`${backgroundColor} w-full p-6 flex flex-col rounded-lg shadow`}
        >
          <h2 className="mb-4 text-5xl font-extrabold leading-none tracking-tight text-left text-gray-900 md:text-5xl lg:text-5xl dark:text-white">
            Scoreboard
          </h2>
          <AnimatePresence>
            {playersList.map((data) => (
              <Player key={data.id} data={data} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
