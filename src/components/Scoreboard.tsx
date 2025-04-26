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
  const rankEmoji = getRankEmoji(index);

  return (
    <motion.div
      layout
      variants={playerVariants}
      className="mb-3 overflow-hidden rounded-lg shadow-lg backdrop-blur-lg"
    >
      <div className="flex flex-col items-center justify-center w-full gap-5 p-4">
        {/* Left side: Rank and Player Info */}
        <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-white rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
          {rankEmoji}
        </div>

        <span className="text-xl font-semibold text-white">{data.name}</span>

        {/* Right side: Points */}
        <div className="px-5 py-2 text-xl font-extrabold text-white rounded-lg shadow-md bg-slate-800/60">
          {pointsEarnedThisRound > 0 ? (
            <CountUp
              start={data.points - pointsEarnedThisRound}
              end={data.points}
            />
          ) : (
            data.points
          )}
        </div>

        {pointsEarnedThisRound > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 text-lg font-bold text-white bg-green-500 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            +{pointsEarnedThisRound}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1 text-lg font-bold text-white rounded-full bg-gray-600/60"
          >
            +0
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Timer component for navigation countdown
const NavigationTimer = ({ seconds, isLastQuestion }) => {
  return (
    <motion.div
      className="fixed flex items-center px-5 py-3 rounded-full shadow-xl bottom-2 right-4 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-sm"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <span className="mr-3 text-lg font-semibold text-white">
        {isLastQuestion ? 'Til resultater:' : 'Næste spørgsmål:'}
      </span>
      <motion.div
        className="flex items-center justify-center text-lg font-bold text-white rounded-full w-9 h-9 bg-gradient-to-r from-purple-600 to-indigo-600"
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
            // Ensure we still navigate even if there's an exception
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
    <div className="flex flex-col items-center w-full h-full min-h-screen px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-center w-full">
        <motion.div
          className="flex items-center justify-center mb-4 md:mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <h1 className="mr-4 text-4xl font-extrabold leading-none tracking-tight text-white md:text-5xl lg:text-6xl">
            Quizazoid
          </h1>
          <motion.img
            className="w-24 h-24 md:w-32 md:h-32"
            src={logo1}
            alt="Quizazoid logo"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        className="w-full max-w-4xl mx-auto mb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Scoreboard Card */}
        <motion.div
          className="w-full overflow-hidden shadow-2xl rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h2 className="text-3xl font-extrabold text-center text-white md:text-4xl">
              Scoreboard
            </h2>
            <p className="mt-2 text-center text-white/80">
              Spørgsmål {currentId + 1}{' '}
              {isLastQuestion ? '(Sidste spørgsmål)' : ''}
            </p>
          </div>

          {/* Players list */}
          <div className="p-6 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm">
            <AnimatePresence>
              {playersList.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center p-8 space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin"></div>
                  <p className="text-xl font-medium text-white">
                    Loading players...
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-1"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {playersList
                    .filter((player) => player.hasBeenAdded)
                    .map((player, index) => (
                      <Player key={player.id} data={player} index={index} />
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation timer */}
      {allPlayersPresent && (
        <NavigationTimer
          seconds={countdownSeconds}
          isLastQuestion={isLastQuestion}
        />
      )}
    </div>
  );
}
