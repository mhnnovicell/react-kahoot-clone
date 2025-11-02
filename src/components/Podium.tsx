import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPlayers } from '../services/playerService';
import { supabase } from '../services/supabaseClient';
import logo1 from '../assets/logo1.png';

const Podium = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPlayers = async () => {
      setLoading(true);
      const playerData = await fetchPlayers();
      const sortedPlayers = playerData
        .filter((player) => player.hasBeenAdded)
        .sort((a, b) => b.points - a.points);
      setPlayers(sortedPlayers);
      setLoading(false);
    };

    getPlayers();

    const resetGameState = async () => {
      try {
        await supabase.from('admin').update({ startGame: false }).eq('id', 1);
      } catch (error) {
        console.error('Error resetting game state:', error);
      }
    };

    resetGameState();

    // Subscribe to player changes
    const subscription = supabase
      .channel('players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          getPlayers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p className="text-2xl text-white">Loading final results...</p>
      </div>
    );
  }

  // Get top 3 players, or all if fewer than 3
  const topPlayers = players.slice(0, 3);
  const otherPlayers = players.slice(3);

  // Helper function to get podium position
  const getPodiumPosition = (index) => {
    // First place in the middle, second on left, third on right
    const positions = [0, 1, 2];
    return positions[index];
  };

  // Helper function to get podium height
  const getPodiumHeight = (index) => {
    // Heights for first, second, and third places
    const heights = ['h-56', 'h-40', 'h-32'];
    return heights[index];
  };

  const handlePlayAgain = async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const quizId = searchParams.get('quizId');

    try {
      console.log('Resetting quiz for play again...');

      // Step 1: Delete all player data
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .neq('id', 0);

      if (deleteError) {
        console.error('Error deleting players:', deleteError);
        throw deleteError;
      }

      // Step 2: Reset admin state
      const { error: adminError } = await supabase
        .from('admin')
        .update({
          startGame: false,
          activeQuizId: quizId || null,
        })
        .eq('id', 1);

      if (adminError) {
        console.error('Error resetting admin:', adminError);
        throw adminError;
      }

      // Step 3: Clear session storage
      sessionStorage.clear();

      console.log('Quiz reset complete, navigating to signup...');

      // Step 4: Navigate back to signup
      navigate(quizId ? `/signup?quizId=${quizId}` : '/signup');
    } catch (error) {
      console.error('Error resetting quiz:', error);
      alert('Failed to reset quiz. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      {/* <motion.div
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
      </motion.div> */}

      {/* Podium Section */}
      <motion.div
        className="flex flex-col justify-center w-full mt-10 mb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="mb-8 text-5xl font-extrabold leading-none tracking-tight text-center text-white">
          Podium
        </h2>

        {topPlayers.map((player, index) => {
          const podiumPosition = getPodiumPosition(index);
          const podiumHeight = getPodiumHeight(podiumPosition);

          console.log(podiumPosition, 'podiumPosition');

          return (
            <motion.div
              key={player.id}
              className="flex flex-col items-center my-6"
              variants={itemVariants}
              style={{ order: podiumPosition + 1 }}
            >
              {/* Player avatar */}
              <div
                className="flex items-center justify-center w-20 h-20 mb-4 text-3xl font-bold text-white rounded-full md:w-24 md:h-24"
                style={{ backgroundColor: player.class }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              {/* Player name and score */}
              <div className="mb-4 text-center">
                <p className="text-xl font-bold text-white">{player.name}</p>
                <p className="text-gray-300 text-md">{player.points} points</p>
              </div>

              {/* Medal for top 3 */}
              <div className="mb-3 text-3xl">
                {podiumPosition === 0
                  ? '🥇'
                  : podiumPosition === 1
                    ? '🥈'
                    : '🥉'}
              </div>

              {/* Podium */}
              <motion.div
                className={`w-24 md:w-32 ${podiumHeight} flex items-center justify-center text-2xl font-bold text-white rounded-t-lg`}
                style={{ backgroundColor: player.class }}
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 1, delay: index * 0.3 }}
              >
                {podiumPosition === 0
                  ? '1st'
                  : podiumPosition === 1
                    ? '2nd'
                    : '3rd'}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Other players list */}
      {otherPlayers.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="mb-4 text-2xl font-bold text-white">
            Other Participants
          </h3>

          <div className="space-y-3">
            {otherPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg bg-opacity-10"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg font-semibold text-white">
                    {index + 4}.
                  </span>
                  <div
                    className="flex items-center justify-center w-8 h-8 mr-3 text-sm font-bold text-white rounded-full"
                    style={{ backgroundColor: player.class }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-lg font-medium text-white">
                    {player.name}
                  </span>
                </div>
                <span className="text-lg font-bold text-white">
                  {player.points}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <motion.button
          className="px-8 py-3 text-lg font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayAgain}
        >
          Play Again
        </motion.button>
      </div>
    </div>
  );
};

export default Podium;
