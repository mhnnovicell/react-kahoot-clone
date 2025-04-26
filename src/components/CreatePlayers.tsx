import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../assets/logo1.png';

import {
  fetchPlayers,
  insertPlayer,
  deletePlayer,
  getCurrentPlayer,
} from '../services/playerService';

import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CreatePlayers() {
  const [value, setValue] = useState('');
  const [displayValues, setDisplayValues] = useState([]);
  const [color, setColor] = useState('#6366f1');
  const [startGame, setStartGame] = useState(false);
  const [playerExists, setPlayerExists] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  const navigate = useNavigate();

  // Check if current player exists
  useEffect(() => {
    const checkCurrentPlayer = async () => {
      const player = await getCurrentPlayer();
      if (player) {
        setCurrentPlayer(player);
        setPlayerExists(true);
      }
    };

    checkCurrentPlayer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!value.trim()) {
      alert('Indtast venligst et navn.');
      return;
    }

    // First check if a player with this name already exists
    const allPlayers = await fetchPlayers();
    const nameExists = allPlayers.some((player) => player.name === value);

    if (nameExists) {
      alert('A player with this name already exists.');
      return;
    }

    const newPlayer = await insertPlayer(value, color);
    if (newPlayer) {
      setCurrentPlayer(newPlayer);
      setPlayerExists(true);
      setValue('');
    }
  };

  const removePlayer = useCallback(
    async (name) => {
      const success = await deletePlayer(name.name);
      if (success && currentPlayer && currentPlayer.name === name.name) {
        setCurrentPlayer(null);
        setPlayerExists(false);
      }
      setValue('');
    },
    [currentPlayer],
  );

  useEffect(() => {
    const isGameReady = supabase
      .channel('admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin' },
        async (payload) => {
          setStartGame((payload.new as { startGame: boolean }).startGame);
        },
      )
      .subscribe();

    let isMounted = true;

    const fetchAndSetPlayers = async () => {
      const players = await fetchPlayers();
      if (isMounted) setDisplayValues(players);
    };

    fetchAndSetPlayers();

    const fetchPlayersFromSupabase = supabase
      .channel('players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        async () => {
          if (isMounted) {
            fetchAndSetPlayers();

            // Re-check current player status
            const currentPlayer = await getCurrentPlayer();
            if (currentPlayer) {
              setCurrentPlayer(currentPlayer);
              setPlayerExists(true);
            } else {
              setCurrentPlayer(null);
              setPlayerExists(false);
            }
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(fetchPlayersFromSupabase);
      supabase.removeChannel(isGameReady);
    };
  }, []);

  useEffect(() => {
    if (startGame) {
      navigate('/questions/0');
    }
  }, [startGame, navigate]);

  const predefinedColors = [
    '#ef4444',
    '#a16207',
    '#38bdf8',
    '#6366f1',
    '#e879f9',
    '#fb7185',
    '#22c55e',
    '#065f46',
    '#4338ca',
    '#ea580c',
    '#06b6d4',
    '#9333ea',
    '#9f1239',
    '#45556c',
  ];

  return (
    <div className="w-full h-full max-w-3xl px-4 py-4">
      {/* Header */}
      <motion.div
        className="flex flex-col items-center justify-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center justify-center mb-2">
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
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        className="mb-8 shadow-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-2xl backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Card Header */}
        <div className="px-6 py-4 rounded-t-2xl bg-gradient-to-r from-purple-600 to-indigo-600">
          <h2 className="text-2xl font-bold text-white">
            {playerExists ? 'Din spiller' : 'Tilføj spiller'}
          </h2>
        </div>

        {/* Card Content */}
        <div className="p-6">
          {/* Current Player Section - only shown if player exists */}
          {playerExists && currentPlayer && (
            <motion.div
              className="p-4 mb-6 bg-white/10 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="mb-3 text-xl font-semibold text-white">
                Din spiller:
              </h3>
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white rounded-full"
                  style={{ backgroundColor: currentPlayer.class }}
                >
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-lg font-semibold text-white">
                  {currentPlayer.name}
                </div>
                <motion.button
                  type="button"
                  className="p-2 ml-auto text-white rounded-full bg-red-500/80 hover:bg-red-600"
                  onClick={() => removePlayer(currentPlayer)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Player List Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold text-white">Spillere:</h3>

            <div className="min-h-[100px] bg-white/10 rounded-lg p-4">
              {displayValues.length === 0 ? (
                <p className="italic text-purple-200">Ingen spillere fundet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {displayValues.map((value, index) => (
                      <motion.div
                        key={index}
                        id={value.name}
                        className="flex items-center px-3 py-2 rounded-lg shadow-md "
                        style={{ backgroundColor: value.class }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        <div className="flex items-center justify-center w-6 h-6 mr-2 text-xs font-bold rounded-full bg-white/20">
                          {value.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">
                          {value.name}
                        </span>
                        <motion.button
                          type="button"
                          className="ml-2 text-white/80 hover:text-white"
                          aria-label="Remove"
                          onClick={() => removePlayer(value)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                          </svg>
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Form Section - only shown if player doesn't exist */}
          {!playerExists && (
            <motion.form
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Dit navn
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 text-white transition-all border rounded-lg bg-white/10 border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Indtast dit navn"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              {/* Color Selection */}
              <div>
                <label
                  htmlFor="color-picker"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Vælg farve
                </label>

                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    id="color-picker"
                    className="w-12 h-12 overflow-hidden bg-transparent border-2 rounded-lg cursor-pointer border-white/20"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                </div>

                {/* Color Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {predefinedColors.map((presetColor, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color === presetColor ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-900' : ''}`}
                      style={{ backgroundColor: presetColor }}
                      onClick={() => setColor(presetColor)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full px-6 py-3 font-medium text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-500/50"
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Tilmeld dig
              </motion.button>
            </motion.form>
          )}

          {/* Waiting Message - only shown if player exists */}
          {playerExists && (
            <div className="w-full mt-6 text-center">
              <div className="p-4 rounded-lg bg-indigo-950/50">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-4 h-4 mr-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <p className="font-medium text-white">
                    Venter på at spillet starter
                  </p>
                </div>
                <p className="text-sm text-purple-200">
                  Quizzen begynder snart!
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
