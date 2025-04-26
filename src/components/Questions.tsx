import {
  useEffect,
  useState,
  lazy,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { client } from '../services/sanityClient';
import { motion } from 'framer-motion';
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
        earnedPoints = 0;
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
        // Update the player in the database
        const totalPoints = currentPlayer.points + earnedPoints;
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
        whileHover={{
          scale: 1,
          transition: { duration: 1 },
        }}
        whileTap={{ scale: 0.5 }}
        key={data._key}
        className={`flex w-full h-full mt-1.5 flex-nowrap ${
          clickedAnswer &&
          clickedAnswer !== data._key &&
          correctAnswerKey !== data._key
            ? 'opacity-20'
            : ''
        }`}
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
            className="w-full h-full p-4 text-lg font-extrabold leading-none tracking-tight text-center text-white rounded-lg shadow lg:text-3xl lg:p-20 lg:m-4 whitespace-nowrap"
            style={{ backgroundColor: data.backgroundColor.hex }}
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

  const memoizedAnswers = useMemo(
    () => answerData.map(renderAnswer),
    [answerData, renderAnswer],
  );

  // If no current player is loaded yet, don't render the full component
  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p className="text-2xl text-white">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full p-6 mb-4">
      <div className="flex items-center justify-center w-full h-full p-4">
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white md:text-5xl lg:text-6xl">
          Quizazoid
        </h1>
        <img className="w-32 h-32" src={logo1} alt="Quizazoid logo" />
      </div>

      <h2 className="my-6 text-4xl font-extrabold leading-none tracking-tight text-center text-white md:my-10 md:text-5xl">
        {question}
      </h2>
      {questionImage && (
        <img
          className="w-full h-auto max-w-full my-4 rounded-lg"
          src={questionImage}
          alt={question}
          loading="eager"
        />
      )}

      <form className="flex flex-wrap items-center justify-center w-full h-full lg:w-1/2">
        {memoizedAnswers}
      </form>
      <Countdown onTimeExpired={handleTimeExpired} />
    </div>
  );
}
