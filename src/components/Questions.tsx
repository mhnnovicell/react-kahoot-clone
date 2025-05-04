import {
  useEffect,
  useState,
  lazy,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { client } from '../services/sanityClient';
import { motion, AnimatePresence } from 'framer-motion';
import logo1 from '../assets/logo1.png';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import {
  getCurrentPlayer,
  updatePlayerScore,
  updatePlayerScoreboardStatus,
} from '../services/playerService';
import WrongAnswer from '../components/WrongAnswer';
import CorrectAnswer from '../components/CorrectAnswer';
import CorrectAnswerWithName from '../components/CorrectAnswerWithName';

const Countdown = lazy(() => import('../components/Countdown'));

// Action types for reducer
const ACTIONS = {
  SET_ANSWER_DATA: 'set_answer_data',
  SET_QUESTION: 'set_question',
  SET_QUESTION_IMAGE: 'set_question_image',
  SET_SELECTED_ANSWER: 'set_selected_answer',
  SET_CLICKED_ANSWER: 'set_clicked_answer',
  SET_CORRECT_ANSWER_KEY: 'set_correct_answer_key',
  SET_ADDED_POINTS: 'set_added_points',
  UPDATE_POINTS: 'update_points',
  SET_CURRENT_PLAYER: 'set_current_player',
};

// Initial state
const initialState = {
  answerData: [],
  question: '',
  questionImage: '',
  points: 0,
  selectedAnswer: null,
  clickedAnswer: null,
  correctAnswerKey: null,
  addedPoints: 0,
  currentPlayer: null,
};

// Reducer function
function quizReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ANSWER_DATA:
      return { ...state, answerData: action.payload };
    case ACTIONS.SET_QUESTION:
      return { ...state, question: action.payload };
    case ACTIONS.SET_QUESTION_IMAGE:
      return { ...state, questionImage: action.payload };
    case ACTIONS.SET_SELECTED_ANSWER:
      return { ...state, selectedAnswer: action.payload };
    case ACTIONS.SET_CLICKED_ANSWER:
      return { ...state, clickedAnswer: action.payload };
    case ACTIONS.SET_CORRECT_ANSWER_KEY:
      return { ...state, correctAnswerKey: action.payload };
    case ACTIONS.SET_ADDED_POINTS:
      return { ...state, addedPoints: action.payload };
    case ACTIONS.UPDATE_POINTS:
      return { ...state, points: state.points + action.payload };
    case ACTIONS.SET_CURRENT_PLAYER:
      return { ...state, currentPlayer: action.payload };
    default:
      return state;
  }
}

export default function Questions() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const {
    answerData,
    question,
    questionImage,
    points,
    selectedAnswer,
    clickedAnswer,
    correctAnswerKey,
    addedPoints,
    currentPlayer,
  } = state;

  const [startTime] = useState(() => Date.now());
  const { id } = useParams();
  const navigate = useNavigate();
  const currentId = parseInt(id, 10);

  // Load the current player
  useEffect(() => {
    const loadCurrentPlayer = async () => {
      const player = await getCurrentPlayer();

      if (!player) {
        console.error('No current player found');
        navigate('/'); // Redirect to player creation
        return;
      }

      dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: player });

      // Reset scoreboard status
      await updatePlayerScoreboardStatus(player.id, false, currentId);
    };

    loadCurrentPlayer();
  }, [navigate, currentId]);

  // Set up subscription to player changes
  useEffect(() => {
    if (!currentPlayer) return;

    const playerSubscription = supabase
      .channel(`player-${currentPlayer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${currentPlayer.id}`,
        },
        (payload) => {
          dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: payload.new });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
    };
  }, [currentPlayer]);

  // Fetch questions from Sanity
  useEffect(() => {
    const getQuestionsFromSanity = async () => {
      try {
        const query = `*[_type == "questions"] {
          title,
          image {
            asset-> {
              url
            }
          },
          Questions
        }`;
        const questions = await client.fetch(query);

        if (questions && questions[id]) {
          dispatch({
            type: ACTIONS.SET_QUESTION,
            payload: questions[id].title,
          });

          dispatch({
            type: ACTIONS.SET_QUESTION_IMAGE,
            payload:
              questions[id].image.asset.url + '?h=600&max-h=600&format=webp',
          });

          dispatch({
            type: ACTIONS.SET_ANSWER_DATA,
            payload: questions[id].Questions,
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    getQuestionsFromSanity();
  }, [id]);

  const handleTimeExpired = useCallback(async () => {
    if (!currentPlayer) return;

    try {
      // Update player with no points added for this question
      await updatePlayerScore(
        currentPlayer.id,
        currentPlayer.points,
        currentPlayer.points,
      );

      // Navigate to the scoreboard
      navigate(`/scoreboard/${id}`);
    } catch (error) {
      console.error('Error updating player points:', error);
      // Still navigate even if there's an error
      navigate(`/scoreboard/${id}`);
    }
  }, [navigate, id, currentPlayer]);

  const handleClick = useCallback(
    async (isCorrect, answerKey) => {
      if (!currentPlayer) return;

      dispatch({ type: ACTIONS.SET_CLICKED_ANSWER, payload: answerKey });

      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000; // Time in seconds

      let earnedPoints = 0;
      if (isCorrect) {
        // Award full 1000 points if answered within 5 seconds
        if (timeTaken <= 5) {
          earnedPoints = 1000;
        } else {
          // After 5 seconds, decrease points over the remaining 55 seconds
          const pointsDeduction = Math.min(timeTaken, 60) * (1000 / 60);
          earnedPoints = Math.max(1000 - pointsDeduction, 0);
        }
        earnedPoints = Math.round(earnedPoints);
      } else {
        // For wrong answers, deduct 100 points if current score > 0
        earnedPoints =
          currentPlayer.points >= 100 ? -100 : -currentPlayer.points;

        // Find the correct answer key
        const correctAnswer = answerData.find((data) => data.korrekt);
        if (correctAnswer) {
          dispatch({
            type: ACTIONS.SET_CORRECT_ANSWER_KEY,
            payload: correctAnswer._key,
          });
        }
      }

      dispatch({ type: ACTIONS.SET_SELECTED_ANSWER, payload: answerKey });
      dispatch({ type: ACTIONS.SET_ADDED_POINTS, payload: earnedPoints });
      dispatch({ type: ACTIONS.UPDATE_POINTS, payload: earnedPoints });

      try {
        // Calculate total points, ensuring it doesn't go negative
        const totalPoints = Math.max(0, currentPlayer.points + earnedPoints);

        await updatePlayerScore(
          currentPlayer.id,
          totalPoints,
          currentPlayer.points,
        );

        // Navigate after a delay
        const timer = window.setTimeout(() => {
          navigate(`/scoreboard/${id}`);
        }, 3500);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error updating points:', error);
      }
    },
    [answerData, startTime, navigate, id, currentPlayer],
  );

  const renderAnswer = useCallback(
    (data) => (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        key={data._key}
        className={`w-full md:w-[calc(50%-0.75rem)] mb-3 ${
          clickedAnswer &&
          clickedAnswer !== data._key &&
          correctAnswerKey !== data._key
            ? 'opacity-30'
            : ''
        }`}
        layout
      >
        {selectedAnswer === data._key ? (
          data.korrekt ? (
            <CorrectAnswer points={addedPoints} />
          ) : (
            <WrongAnswer />
          )
        ) : correctAnswerKey && correctAnswerKey === data._key ? (
          <CorrectAnswerWithName name={data.answer} />
        ) : (
          <button
            className="w-full h-full p-6 text-xl font-extrabold leading-none tracking-tight text-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[80px] md:min-h-[100px] lg:text-2xl"
            style={{
              backgroundColor: data.backgroundColor.hex,
              boxShadow: `0 8px 0 ${adjustColor(data.backgroundColor.hex, -30)}, 0 10px 20px rgba(0, 0, 0, 0.3)`,
            }}
            onClick={(event) => {
              event.preventDefault();
              handleClick(data.korrekt, data._key);
            }}
            type="button"
          >
            {data.answer}
          </button>
        )}
      </motion.div>
    ),
    [clickedAnswer, correctAnswerKey, selectedAnswer, handleClick, addedPoints],
  );

  // Helper function to darken a color for button shadows
  function adjustColor(hex, amount) {
    return (
      '#' +
      hex
        .replace(/^#/, '')
        .replace(/../g, (color) =>
          (
            '0' +
            Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(
              16,
            )
          ).substr(-2),
        )
    );
  }

  const memoizedAnswers = useMemo(
    () => answerData.map(renderAnswer),
    [answerData, renderAnswer],
  );

  // If no current player is loaded yet, don't render the full component
  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center p-8 bg-white rounded-lg bg-opacity-10 backdrop-blur-sm"
        >
          <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-2xl font-bold text-white">Loading quiz...</p>
        </motion.div>
      </div>
    );
  }

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

      {/* Question Card */}
      <motion.div
        className="w-full max-w-4xl mx-auto mb-6 overflow-hidden shadow-xl bg-gradient-to-b from-indigo-900/90 to-purple-900/80 rounded-xl backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Question number */}
        <div className="p-2 font-bold text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600">
          Spørgsmål {Number(id) + 1}
        </div>

        {/* Question content */}
        <div className="p-6">
          <h2 className="my-4 text-3xl font-extrabold leading-tight text-center text-white sm:text-4xl md:my-6">
            <AnimatePresence mode="wait">
              <motion.span
                key={question}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {question}
              </motion.span>
            </AnimatePresence>
          </h2>

          {questionImage && (
            <motion.div
              className="relative w-full my-6 overflow-hidden rounded-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <img
                className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[400px]"
                src={questionImage}
                alt={question}
                loading="eager"
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Answers Grid */}
      <motion.div
        className="w-full max-w-4xl mx-auto mb-8"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        <div className="flex flex-wrap justify-between gap-3">
          {memoizedAnswers}
        </div>
      </motion.div>

      {/* Countdown Timer */}
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Countdown onTimeExpired={handleTimeExpired} />
      </motion.div>
    </div>
  );
}
