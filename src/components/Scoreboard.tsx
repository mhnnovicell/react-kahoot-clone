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
          {pointsEarnedThisRound !== 0 ? (
            <CountUp
              start={data.points - pointsEarnedThisRound}
              end={data.points}
            />
          ) : (
            data.points
          )}
        </div>

        {/* Points indicator with three states: positive, negative, or zero */}
        {pointsEarnedThisRound > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 text-lg font-bold text-white bg-green-500 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            +{pointsEarnedThisRound}
          </motion.div>
        ) : pointsEarnedThisRound < 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 text-lg font-bold text-white bg-red-500 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            {pointsEarnedThisRound}
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
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const { id } = useParams();
  const currentId = parseInt(id, 10);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfLastQuestion = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const quizId = searchParams.get('quizId');

        if (!quizId) {
          console.error('No quiz ID provided in URL');
          return;
        }

        // Fetch only the questions for the current quiz
        const query = `*[_type == "quiz" && _id == $quizId][0] {
          "questionsCount": count(questions)
        }`;

        const result = await client.fetch(query, { quizId });

        if (result && result.questionsCount) {
          // Check if we're on the last question (0-based index)
          if (currentId + 1 >= result.questionsCount) {
            setIsLastQuestion(true);
          }
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

    let countdownInterval;
    let navigationTimeout;
    let navigationTimestamp; // Track when navigation should happen

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigationTimestamp) {
        const now = Date.now();
        const timeElapsed = now - navigationTimestamp;

        // If navigation time has passed while tab was hidden, navigate immediately
        if (timeElapsed >= 0) {
          console.log(
            'Tab became visible, navigation time has passed - navigating now',
          );
          performNavigation();
        }
      }
    };

    const performNavigation = async () => {
      try {
        // Reset onScoreboard status for all players before navigating
        const { error } = await supabase
          .from('players')
          .update({ onScoreboard: false })
          .eq('currentQuestionId', currentId);

        if (error) {
          console.error('Error resetting player status:', error);
        }

        const searchParams = new URLSearchParams(window.location.search);
        const quizId = searchParams.get('quizId');

        // Navigate with the quizId
        if (isLastQuestion) {
          navigate(`/podium?quizId=${quizId}`);
        } else {
          const nextId = currentId + 1;
          navigate(`/questions/${nextId}?quizId=${quizId}`);
        }
      } catch (err) {
        console.error('Error during navigation:', err);
        // Fallback navigation
        const searchParams = new URLSearchParams(window.location.search);
        const quizId = searchParams.get('quizId');
        if (isLastQuestion) {
          navigate(`/podium?quizId=${quizId}`);
        } else {
          const nextId = currentId + 1;
          navigate(`/questions/${nextId}?quizId=${quizId}`);
        }
      }
    };

    if (allPlayersPresent) {
      const nextId = currentId + 1;

      // Calculate when navigation should happen (10 seconds from now)
      navigationTimestamp = Date.now() + 10000;

      // Setup countdown - use requestAnimationFrame for better reliability
      let lastUpdate = Date.now();
      const updateCountdown = () => {
        const now = Date.now();
        const elapsed = now - lastUpdate;

        if (elapsed >= 1000) {
          lastUpdate = now;
          setCountdownSeconds((prev) => {
            const newValue = Math.max(0, prev - 1);
            return newValue;
          });
        }

        // Continue animation if countdown hasn't finished
        if (Date.now() < navigationTimestamp) {
          countdownInterval = requestAnimationFrame(updateCountdown);
        }
      };

      countdownInterval = requestAnimationFrame(updateCountdown);

      // Setup navigation timer
      navigationTimeout = window.setTimeout(() => {
        console.log('Navigation timeout fired');
        performNavigation();
      }, 10000);

      // Add visibility change listener
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (countdownInterval) {
          cancelAnimationFrame(countdownInterval);
        }
        if (navigationTimeout) {
          clearTimeout(navigationTimeout);
        }
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      };
    }

    return () => {
      supabase.removeChannel(subscription);
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
              Stilling
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
