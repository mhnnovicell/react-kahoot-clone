import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '../services/sanityClient';
import { supabase } from '../services/supabaseClient';
import logo1 from '../assets/logo1.png';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        // Update the query to fetch quizzes instead of questions
        const query = `*[_type == "quiz"] {
            _id,
            title,
            description,
            image {
              asset-> {
                url
              }
            },
            "questionCount": count(questions)
          }`;
        const result = await client.fetch(query);

        // Filter out duplicate quizzes based on title
        const uniqueQuizzes = [];
        const uniqueTitles = new Set();

        result.forEach((quiz) => {
          if (!uniqueTitles.has(quiz.title)) {
            uniqueTitles.add(quiz.title);
            uniqueQuizzes.push(quiz);
          } else {
            console.warn(
              `Duplicate quiz found: "${quiz.title}" with ID ${quiz._id}`,
            );
          }
        });

        setQuizzes(uniqueQuizzes);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // In Dashboard.tsx
  const handlePlayQuiz = async (quizId) => {
    try {
      // Set this quiz as active in Supabase admin table
      const { data, error } = await supabase
        .from('admin')
        .update({
          activeQuizId: quizId,
          startGame: false, // Reset game state
        })
        .eq('id', 1)
        .select();

      if (error) {
        throw error;
      }

      setActiveQuiz(quizId);

      // Reset any existing players' state
      await supabase
        .from('players')
        .update({
          onScoreboard: false,
          currentQuestionId: 0,
          points: 0,
          previousPoints: 0,
        })
        .neq('id', 0); // Update all players

      // Navigate to the home screen where players can join
      // Include the quizId as a parameter
      navigate(`/signup?quizId=${quizId}`);
    } catch (err) {
      console.error('Error starting quiz:', err);
      alert('Failed to start quiz');
    }
  };

  const handleStartGame = async () => {
    if (!activeQuiz) return;

    try {
      // Update the startGame flag to trigger the game to begin
      const { error } = await supabase
        .from('admin')
        .update({ startGame: true })
        .eq('id', 1);

      if (error) {
        throw error;
      }

      // Navigate to the first question with quizId in URL
      navigate(`/questions/0?quizId=${activeQuiz}`);
    } catch (err) {
      console.error('Error starting game:', err);
      alert('Failed to start game');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        // Set a "deleting" state on the quiz to be deleted
        setQuizzes(
          quizzes.map((quiz) =>
            quiz._id === id ? { ...quiz, isDeleting: true } : quiz,
          ),
        );

        // Wait for the animation to finish before actually removing from state
        setTimeout(async () => {
          await client.delete(id);
          // Update the UI
          setQuizzes((currentQuizzes) =>
            currentQuizzes.filter((quiz) => quiz._id !== id),
          );
        }, 500); // Match this to your exit animation duration
      } catch (err) {
        console.error('Error deleting quiz:', err);
        alert('Failed to delete quiz');
        // Restore the quiz if deletion failed
        setQuizzes(
          quizzes.map((quiz) =>
            quiz._id === id ? { ...quiz, isDeleting: false } : quiz,
          ),
        );
      }
    }
  };

  const handleEditQuiz = (id) => {
    navigate(`/edit-quiz/${id}`);
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-screen px-4 py-6 md:px-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <h1 className="mr-4 text-4xl font-extrabold leading-none tracking-tight text-white md:text-5xl lg:text-6xl">
          Quizazoid Dashboard
        </h1>
        <motion.img
          className="w-16 h-16 md:w-20 md:h-20"
          src={logo1}
          alt="Quizazoid logo"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Create new quiz button */}
      <div className="w-full max-w-5xl mb-8">
        <Link to="/create-quiz">
          <motion.button
            className="px-6 py-3 text-lg font-bold text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create New Quiz
          </motion.button>
        </Link>
      </div>

      {/* Active quiz control panel */}
      {activeQuiz && (
        <motion.div
          className="w-full max-w-5xl p-6 mb-8 rounded-lg shadow-lg bg-gradient-to-r from-green-600/80 to-emerald-700/80"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center md:flex-row md:justify-between">
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">
                Active Quiz Ready
              </h2>
              <p className="text-white/80">
                {quizzes.find((q) => q._id === activeQuiz)?.title ||
                  'Quiz selected'}
              </p>
            </div>
            <motion.button
              className="px-8 py-3 mt-4 text-lg font-bold text-white rounded-lg shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
            >
              Start Game
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        className="w-full max-w-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {loading ? (
          <div className="flex items-center justify-center w-full p-12">
            <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-white bg-red-500 rounded-lg">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 text-center rounded-lg shadow-md bg-white/10">
            <p className="mb-4 text-xl text-white">No quizzes found</p>
            <p className="text-purple-200">
              Create your first quiz by clicking the button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  className={`overflow-hidden rounded-lg shadow-lg transition-all ${
                    activeQuiz === quiz._id
                      ? 'ring-4 ring-green-400 bg-gradient-to-b from-indigo-900/90 to-purple-900/90'
                      : 'bg-gradient-to-b from-indigo-900/80 to-purple-900/80'
                  } ${quiz.isDeleting ? 'pointer-events-none' : ''}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{
                    opacity: quiz.isDeleting ? 0 : 1,
                    y: quiz.isDeleting ? -50 : 0,
                    scale: quiz.isDeleting ? 0.8 : 1,
                    rotateZ: quiz.isDeleting ? -5 : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    y: -50,
                    rotateZ: -5,
                  }}
                  transition={{
                    type: 'spring',
                    duration: 0.5,
                    delay: index * 0.05,
                    // Use different timing for exit animations
                    exit: { duration: 0.3 },
                  }}
                  layout
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  {/* Quiz Image */}
                  <div className="relative w-full overflow-hidden bg-gray-800 h-96">
                    {quiz.image?.asset?.url ? (
                      <img
                        src={`${quiz.image.asset.url}?h=1920&max-h=1920&format=webp`}
                        alt={quiz.title}
                        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* Question count badge */}
                    <div className="absolute px-2 py-1 text-sm font-medium text-white rounded-md top-2 right-2 bg-black/50">
                      {quiz.questionCount || 0} questions
                    </div>
                  </div>

                  {/* Quiz Info */}
                  <div className="p-5">
                    <h3 className="mb-3 text-xl font-bold text-white truncate">
                      {quiz.title || 'Untitled Quiz'}
                    </h3>

                    {quiz.description && (
                      <p className="mb-3 text-sm text-white/70 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        className={`px-3 py-2 text-sm font-medium text-white rounded-md ${
                          activeQuiz === quiz._id
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePlayQuiz(quiz._id, index)}
                      >
                        {activeQuiz === quiz._id ? 'Selected' : 'Play'}
                      </motion.button>

                      <motion.button
                        className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditQuiz(quiz._id)}
                      >
                        Edit
                      </motion.button>

                      <motion.button
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteQuiz(quiz._id)}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
