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
import { fetchPlayers } from '../services/playerService';
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
  } = state;

  const [startTime] = useState(() => Date.now());
  const { id } = useParams();
  const navigate = useNavigate();

  // Add this at the beginning of your Questions component
  useEffect(() => {
    const validateCurrentPlayer = async () => {
      const currentPlayerId = sessionStorage.getItem('currentPlayerId');

      if (!currentPlayerId) {
        console.error('No currentPlayerId found in sessionStorage!');
        navigate('/'); // Redirect to player creation
        return;
      }

      // Load the specific player data for this session
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', currentPlayerId)
          .single();

        if (error || !data) {
          console.error('Failed to load current player data:', error);
          // Clear invalid currentPlayerId
          sessionStorage.removeItem('currentPlayerId');
          navigate('/'); // Redirect to player creation
          return;
        }

        // Update sessionStorage with just this player
        const playersArray = [data];
        sessionStorage.setItem('players', JSON.stringify(playersArray));

        console.log('Current player loaded successfully:', data);
      } catch (err) {
        console.error('Error validating current player:', err);
        navigate('/');
      }
    };

    validateCurrentPlayer();
  }, [navigate]);

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

  useEffect(() => {
    const resetScoreboardStatus = async () => {
      const currentPlayerId = sessionStorage.getItem('currentPlayerId');
      if (currentPlayerId) {
        const { error } = await supabase
          .from('players')
          .update({ onScoreboard: false, currentQuestionId: id })
          .eq('id', currentPlayerId);

        if (error) console.error('Error resetting scoreboard status:', error);
      }
    };

    resetScoreboardStatus();
  }, [id]);

  // Initialize players
  useEffect(() => {
    const initializePlayers = async () => {
      let players = JSON.parse(sessionStorage.getItem('players')) || [];

      if (players.length === 0) {
        players = await fetchPlayers();
        sessionStorage.setItem('players', JSON.stringify(players));
      }
    };

    initializePlayers();
  }, []);

  const handleTimeExpired = useCallback(async () => {
    let players = JSON.parse(sessionStorage.getItem('players')) || [];
    if (players.length === 0) {
      console.error('No players found');
      return;
    }

    // Get the current player ID from sessionStorage
    const currentPlayerId = sessionStorage.getItem('currentPlayerId');

    // Find the current player based on ID
    const currentPlayer = players.find(
      (player) => player.id === currentPlayerId,
    );

    if (!currentPlayer) {
      console.error('Current player not found');
      return;
    }

    try {
      // Only update the current player to have addedPoints = 0
      const { error } = await supabase
        .from('players')
        .update({
          // Keep points the same
          points: currentPlayer.points,
          // Set previous points to current points
          previousPoints: currentPlayer.points,
          // Set added points to 0
          addedPoints: 0,
        })
        .eq('id', currentPlayer.id)
        .select('*');

      if (error) {
        throw error;
      }

      // Update local storage for the current player
      const updatedPlayers = players.map((player) => {
        if (player.id === currentPlayer.id) {
          return {
            ...player,
            previousPoints: player.points,
            addedPoints: 0,
          };
        }
        return player;
      });
      sessionStorage.setItem('players', JSON.stringify(updatedPlayers));

      // Navigate to the scoreboard
      navigate(`/scoreboard/${id}`);
    } catch (error) {
      console.error('Error updating player points:', error);
      // Still navigate even if there's an error
      navigate(`/scoreboard/${id}`);
    }
  }, [navigate, id]);

  const handleClick = useCallback(
    async (isCorrect, answerKey) => {
      dispatch({ type: ACTIONS.SET_CLICKED_ANSWER, payload: answerKey });

      // Get the current player ID from sessionStorage
      const currentPlayerId = sessionStorage.getItem('currentPlayerId');
      if (!currentPlayerId) {
        console.error('No currentPlayerId found in sessionStorage');
        return;
      }

      console.log('Current player ID from sessionStorage:', currentPlayerId);

      let players = JSON.parse(sessionStorage.getItem('players')) || [];
      if (players.length === 0) {
        console.error('No players found in sessionStorage');

        // Try to reload the current player from the database
        try {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', currentPlayerId)
            .single();

          if (error || !data) {
            console.error('Failed to reload player data:', error);
            return;
          }

          // Update players array with just this player
          players = [data];
          sessionStorage.setItem('players', JSON.stringify(players));
          console.log('Player reloaded from database:', data);
        } catch (err) {
          console.error('Error reloading player:', err);
          return;
        }
      }

      console.log(
        'Players in sessionStorage:',
        players.map((p) => ({ id: p.id, name: p.name })),
      );

      // Find the current player based on ID
      const currentPlayer = players.find(
        (player) => player.id === currentPlayerId,
      );

      if (!currentPlayer) {
        console.error('Current player not found! ID:', currentPlayerId);

        // Try to reload the player from database as a fallback
        try {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', currentPlayerId)
            .single();

          if (error || !data) {
            console.error('Failed to reload player as fallback:', error);
            return;
          }

          // Use this player and update sessionStorage
          const updatedPlayers = [...players, data];
          sessionStorage.setItem('players', JSON.stringify(updatedPlayers));

          // Continue with the reloaded player
          const endTime = Date.now();
          processAnswer(data, isCorrect, answerKey, endTime);
          return;
        } catch (err) {
          console.error('Error in fallback player reload:', err);
          return;
        }
      }

      const endTime = Date.now();
      processAnswer(currentPlayer, isCorrect, answerKey, endTime);
    },
    [answerData, startTime, navigate, id],
  );

  // Helper function to process the answer logic
  const processAnswer = async (player, isCorrect, answerKey, endTime) => {
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
      // Update the player
      const { data, error } = await supabase
        .from('players')
        .update({
          points: player.points + earnedPoints,
          previousPoints: player.points,
          addedPoints: earnedPoints,
        })
        .eq('id', player.id)
        .select('*');

      console.log('Player after update:', data);

      if (error) {
        throw error;
      }

      // Update players in sessionStorage
      let players = JSON.parse(sessionStorage.getItem('players')) || [];
      const updatedPlayers = players.map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            previousPoints: p.points,
            points: p.points + earnedPoints,
            addedPoints: earnedPoints,
          };
        }
        return p;
      });

      sessionStorage.setItem('players', JSON.stringify(updatedPlayers));

      // Navigate after a delay
      const timer = window.setTimeout(() => {
        navigate(`/scoreboard/${id}`);
      }, 3500);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

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
