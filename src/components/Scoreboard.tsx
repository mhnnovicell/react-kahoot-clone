import { useEffect, useState, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import logo1 from '../assets/logo1.png';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { client } from '../services/sanityClient';

// Updated animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.5,
    },
  },
};

const playerVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
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
      transition: { duration: 2, ease: 'easeInOut', delay: 0.5 },
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

const getRankColor = (index) => {
  switch (index) {
    case 0:
      return 'bg-yellow-300'; // Gold for 1st
    case 1:
      return 'bg-gray-300'; // Silver for 2nd
    case 2:
      return 'bg-amber-600'; // Bronze for 3rd
    default:
      return 'bg-slate-700'; // Default
  }
};

const getRankEmoji = (index) => {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return `${index + 1}`;
  }
};

const Player = ({ data, index }) => {
  // Calculate points earned in this round
  const pointsEarnedThisRound = data.points - (data.previousPoints || 0);
  const rankColor = getRankColor(index);
  const rankEmoji = getRankEmoji(index);

  return (
    <motion.div
      layout
      variants={playerVariants}
      className="flex items-center justify-center w-full p-3 rounded-lg shadow-lg backdrop-blur-sm bg-opacity-90"
    >
      <div className="flex items-center w-full justify-evenly">
        {/* Rank indicator */}
        <span className="flex items-center w-10 h-10 text-lg font-bold text-white ">
          {rankEmoji}
        </span>

        {/* Player avatar and name */}
        <span className="text-xl font-semibold text-white">{data.name}</span>
        {/* Points display */}
        <div className="px-5 py-2 text-xl font-extrabold text-white rounded-lg shadow-md bg-slate-800">
          {pointsEarnedThisRound > 0 ? (
            <CountUp
              start={data.points - pointsEarnedThisRound}
              end={data.points}
            />
          ) : (
            data.points
          )}
        </div>
        {pointsEarnedThisRound > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 text-lg font-bold text-white bg-green-500 rounded-full"
          >
            +{pointsEarnedThisRound}
          </motion.div>
        )}
        {pointsEarnedThisRound === 0 && (
          <span className="px-3 py-1 text-lg font-bold text-white bg-gray-600 rounded-full">
            +0
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Timer component for navigation countdown
const NavigationTimer = ({ seconds }) => {
  return (
    <motion.div
      className="fixed bottom-0 flex items-center px-4 py-2 mt-6 text-white rounded-full shadow-lg right-4 bg-slate-800"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <span className="mr-2">Næste spørgsmål:</span>
      <motion.div
        className="flex items-center justify-center w-8 h-8 font-bold rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
        initial={{ scale: 0.8 }}
        animate={{
          scale: [1, 1.2, 1],
          transition: { repeat: Infinity, duration: 1 },
        }}
      >
        {seconds}
      </motion.div>
    </motion.div>
  );
};

export default function Scoreboard() {
  const [playersList, setPlayersList] = useState([]);
  const [allPlayersPresent, setAllPlayersPresent] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(7);
  const { id } = useParams();
  const currentId = parseInt(id, 10);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfLastQuestion = async () => {
      try {
        const query = `*[_type == "questions"] {
          _id
        }`;
        const questions = await client.fetch(query);

        // If current question ID matches the last question's index
        if (currentId === questions.length - 1) {
          setIsLastQuestion(true);
        }
      } catch (error) {
        console.error('Error checking if last question:', error);
      }
    };

    checkIfLastQuestion();
  }, [currentId]);

  // Get current player ID from sessionStorage
  useEffect(() => {
    const currentPlayerId = sessionStorage.getItem('currentPlayerId');
    if (currentPlayerId) {
      // Fetch the current player data
      const fetchCurrentPlayer = async () => {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', currentPlayerId)
          .single();

        if (error) {
          console.error('Error fetching current player:', error);
          return;
        }

        setCurrentPlayer(data);

        // Update the player's status to show they're on the scoreboard
        const { error: updateError } = await supabase
          .from('players')
          .update({ onScoreboard: true, currentQuestionId: currentId })
          .eq('id', data.id);

        if (updateError)
          console.error('Error updating player status:', updateError);
      };

      fetchCurrentPlayer();
    }
  }, [currentId]);

  const checkAndFetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching scoreboard:', error);
      return;
    }

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
        () => {
          checkAndFetchPlayers();
        },
      )
      .subscribe();

    // Countdown for navigation when all players are present
    let countdownInterval;
    let navigationTimeout;

    if (allPlayersPresent) {
      const nextId = currentId + 1;

      // Setup countdown
      countdownInterval = setInterval(() => {
        setCountdownSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);

      // Setup navigation timer
      navigationTimeout = window.setTimeout(() => {
        // Use an immediately invoked async function to handle the async operations
        (async () => {
          try {
            // Reset onScoreboard status for all players before navigating
            const { error } = await supabase
              .from('players')
              .update({ onScoreboard: false })
              .eq('currentQuestionId', currentId);

            if (error) {
              console.error('Error resetting player status:', error);
            }

            // Navigate after the database update completes
            if (isLastQuestion) {
              navigate('/podium');
            } else {
              navigate(`/questions/${nextId}`);
            }
          } catch (err) {
            console.error('Error during navigation:', err);
            // // Ensure we still navigate even if there's an exception
            if (isLastQuestion) {
              navigate('/podium');
            } else {
              navigate(`/questions/${nextId}`);
            }
          }
        })();
      }, 7000);
    }

    return () => {
      supabase.removeChannel(subscription);
      if (countdownInterval) clearInterval(countdownInterval);
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [
    checkAndFetchPlayers,
    currentId,
    navigate,
    allPlayersPresent,
    isLastQuestion,
  ]);

  return (
    <div className="w-full h-full min-h-screen py-8 bg-gradient-to-b from-purple-900 to-blue-900">
      <div className="container px-4 mx-auto">
        {/* Header with logo */}
        <div className="flex items-center justify-center mb-12">
          <h1 className="text-4xl font-extrabold leading-none tracking-tight text-center text-white md:text-5xl lg:text-6xl">
            Quizazoid
          </h1>
          <img className="w-32 h-32" src={logo1} alt="Quizazoid logo" />
        </div>

        {/* Main content */}
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Scoreboard heading */}
          <div className="p-6 mb-1 shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
            <h2 className="text-4xl font-extrabold text-center text-white">
              Scoreboard
            </h2>
            <p className="mt-2 text-center text-white opacity-80">
              Spørgsmål {currentId + 1}{' '}
              {isLastQuestion ? '(Sidste spørgsmål)' : ''}
            </p>
          </div>

          {/* Players list */}
          <motion.div
            className="mb-10 shadow-xl bg-gradient-to-b from-indigo-900/90 to-purple-900/80 backdrop-blur-sm rounded-b-xl"
            layout
          >
            <AnimatePresence>
              {playersList.length === 0 ? (
                <motion.div
                  className="flex items-center justify-center p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-xl text-white">Loading players...</p>
                </motion.div>
              ) : (
                playersList
                  .filter((player) => player.hasBeenAdded)
                  .map((player, index) => (
                    <Player key={player.id} data={player} index={index} />
                  ))
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* Navigation timer */}
      {allPlayersPresent && <NavigationTimer seconds={countdownSeconds} />}
    </div>
  );
}
