import { useEffect, useState, lazy, useCallback, useMemo } from 'react';
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

export default function Questions() {
  const [answerData, setAnswers] = useState([]);
  const [question, setQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const { id } = useParams(); // Get the route parameter
  const [startTime, setStartTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [clickedAnswer, setClickedAnswer] = useState(null);
  const [correctAnswerKey, setCorrectAnswerKey] = useState(null);
  const [addedPoints, setAddedPoints] = useState(0); // New state for added points

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      getQuestionsFromSanity();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

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
      client.fetch(query).then((questions) => {
        console.log(questions, 'questions');
        console.log(questions[id], 'questions[id]');

        setQuestion(questions[id].title);
        setQuestionImage(
          questions[id].image.asset.url + '?h=600&max-h=600&format=webp',
        );
        setAnswers(questions[id].Questions);
      });
    } catch (error) {
      console.error(error);
    }
  };

  console.log(answerData, 'answerData');

  const navigate = useNavigate();

  useEffect(() => {
    const checkAndFetchPlayers = async () => {
      let players = JSON.parse(sessionStorage.getItem('players')) || [];

      if (players.length === 0) {
        // Fetch players from Supabase if not found in sessionStorage
        players = await fetchPlayers();
        console.log(players, 'players');
        sessionStorage.setItem('players', JSON.stringify(players));
      }
    };

    checkAndFetchPlayers();
  }, []);

  const handleClick = useCallback(
    async (isCorrect, answerKey) => {
      setClickedAnswer(answerKey);
      let players = JSON.parse(sessionStorage.getItem('players')) || [];

      if (players.length === 0) {
        console.error('No players found');
        return;
      }

      console.log(players, 'players');

      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000; // Time in seconds

      console.log(isCorrect, 'isCorrect');

      let earnedPoints = 0;
      if (isCorrect) {
        // Start with 1000 points and decrease linearly over 60 seconds
        // 1000/60 = 16.67 points lost per second
        earnedPoints = Math.max(1000 - timeTaken * (1000 / 60), 0);
        earnedPoints = Math.round(earnedPoints); // Round to the nearest whole number
      } else {
        earnedPoints = 0;
        // Find the correct answer key
        const correctAnswer = answerData.find((data) => data.korrekt);
        setCorrectAnswerKey(correctAnswer._key);
      }

      setSelectedAnswer(answerKey); // Set the selected answer key

      console.log(earnedPoints, 'earnedPoints');

      setPoints((prevPoints) => prevPoints + earnedPoints);
      setAddedPoints(earnedPoints); // Set the added points

      console.log(points, 'points');

      try {
        // Update points for each player in Supabase
        const updates = players.map(async (player) => {
          const { data, error } = await supabase
            .from('players')
            .update({
              points: player.points + earnedPoints,
              previousPoints: player.points,
              addedPoints: earnedPoints,
            })
            .eq('id', player.id)
            .select('*');

          if (error) {
            throw error;
          }
          return data;
        });

        const results = await Promise.all(updates);
        console.log('Points updated for all players:', results);

        // Store the updated players in sessionStorage too
        const updatedPlayers = players.map((player) => ({
          ...player,
          previousPoints: player.points,
          points: player.points + earnedPoints,
          addedPoints: earnedPoints,
        }));
        sessionStorage.setItem('players', JSON.stringify(updatedPlayers));

        // Then navigate after all updates are complete
        window.setTimeout(() => {
          navigate(`/scoreboard/${id}`);
        }, 3500);
      } catch (error) {
        console.error('Error updating points:', error);
      }
    },
    [answerData, startTime, navigate, id, points],
  );

  const renderAnswer = useCallback(
    (data) => {
      console.log('Rendering answer:', data);

      return (
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
      );
    },
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
        <img className="w-32 h-32 " src={logo1} alt="image description" />
      </div>

      <h2 className="my-6 text-4xl font-extrabold leading-none tracking-tight text-center text-white md:my-10 md:text-5xl ">
        {question}
      </h2>
      <img
        className="w-full h-auto max-w-full my-4 rounded-lg"
        src={questionImage}
        alt={question}
        loading="eager"
      />

      <form className="flex flex-wrap items-center justify-center w-full h-full lg:w-1/2">
        {memoizedAnswers}
      </form>
      <Countdown></Countdown>
    </div>
  );
}
