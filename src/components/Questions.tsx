import { useEffect, useState, lazy } from 'react';
import { client } from '../services/sanityClient';
import { motion } from 'framer-motion';

const Countdown = lazy(() => import('../components/Countdown'));

export default function Questions() {
  const [answerData, setAnswers] = useState([]);
  const [question, setQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState('');

  useEffect(() => {
    let isMounted = true; // Add this line

    if (isMounted) {
      getQuestionsFromSanity();
    }

    return () => {
      isMounted = false; // Add this line
    };
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
        setQuestion(questions[0].title);
        setQuestionImage(
          questions[0].image.asset.url + '?h=500&max-h=600&format=webp',
        );
        questions.forEach((question) => {
          setAnswers(question.Questions);
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  console.log(answerData, 'questionsdata');
  console.log(question, 'question');

  return (
    <div className="flex flex-col items-center w-full h-full p-4 mb-4">
      <h1 className="my-6 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        OwlHoot🦉
      </h1>
      <h2 className="my-10 text-4xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-5xl lg:text-5xl dark:text-white">
        {question}
      </h2>
      <Countdown></Countdown>
      <img
        className="h-auto max-w-full my-4 rounded-lg"
        src={questionImage}
        alt={question}
      />

      <form className="flex flex-wrap items-center justify-center w-full h-full lg:w-1/2">
        {answerData.map(function (data) {
          return (
            <motion.div
              whileHover={{
                scale: 1.1,
                transition: { duration: 1 },
              }}
              whileTap={{ scale: 0.9 }}
              key={data._key}
              className="flex w-full my-4 lg:w-1/2"
            >
              <button
                className="w-full h-full p-20 m-4 text-4xl font-extrabold leading-none tracking-tight text-white rounded-lg shadow"
                style={{ backgroundColor: data.backgroundColor.hex }}
              >
                {data.answer}
              </button>
            </motion.div>
          );
        })}
      </form>
    </div>
  );
}
