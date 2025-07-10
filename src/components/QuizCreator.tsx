import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, createQuiz } from '../services/createQuiz';
import logo1 from '../assets/logo1.png';
import { useNavigate } from 'react-router-dom';

// Helper to create an empty answer
const emptyAnswer = () => ({
  id: uuidv4(),
  text: '',
  isCorrect: false,
  color: '#6366f1',
});

// Helper to create an empty question with default answers
const emptyQuestion = () => {
  const answers = [emptyAnswer(), emptyAnswer(), emptyAnswer(), emptyAnswer()];
  // Make the first answer correct by default
  answers[0].isCorrect = true;

  return {
    id: uuidv4(),
    title: '',
    imageFile: null,
    imagePreview: '',
    imageAssetId: null,
    answers: answers,
    correctAnswerIndex: 0,
  };
};

export default function QuizCreator() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const questionFileInputRefs = useRef({});

  // Quiz metadata
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  // Questions management
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // UI states
  const [step, setStep] = useState(1); // 1: Quiz info, 2: Questions, 3: Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get the currently active question
  const activeQuestion = questions[activeQuestionIndex];

  // Handle quiz cover image selection
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle question image selection
  const handleQuestionImageChange = (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id === questionId) {
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setQuestions((prevQuestions) =>
              prevQuestions.map((q2) =>
                q2.id === questionId
                  ? { ...q2, imagePreview: reader.result }
                  : q2,
              ),
            );
          };
          reader.readAsDataURL(file);

          return { ...q, imageFile: file };
        }
        return q;
      }),
    );
  };

  // Add a new question to the quiz
  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
    setActiveQuestionIndex(questions.length);
  };

  // Remove a question from the quiz
  const removeQuestion = (idToRemove) => {
    if (questions.length <= 1) {
      setError('A quiz must have at least one question');
      return;
    }

    const newQuestions = questions.filter((q) => q.id !== idToRemove);
    setQuestions(newQuestions);

    // Update active question index if needed
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  // Update question title
  const updateQuestionTitle = (value) => {
    setQuestions(
      questions.map((q, i) =>
        i === activeQuestionIndex ? { ...q, title: value } : q,
      ),
    );
  };

  // Handle answer text change
  const handleAnswerTextChange = (answerId, value) => {
    setQuestions(
      questions.map((q, i) => {
        if (i === activeQuestionIndex) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId ? { ...a, text: value } : a,
            ),
          };
        }
        return q;
      }),
    );
  };

  // Handle setting correct answer
  const handleSetCorrectAnswer = (index) => {
    setQuestions(
      questions.map((q, i) => {
        if (i === activeQuestionIndex) {
          return {
            ...q,
            correctAnswerIndex: index,
            answers: q.answers.map((a, j) => ({
              ...a,
              isCorrect: j === index,
            })),
          };
        }
        return q;
      }),
    );
  };

  // Handle answer color change
  const handleColorChange = (answerId, color) => {
    setQuestions(
      questions.map((q, i) => {
        if (i === activeQuestionIndex) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId ? { ...a, color } : a,
            ),
          };
        }
        return q;
      }),
    );
  };

  // Add a new answer to the active question
  const addAnswer = () => {
    setQuestions(
      questions.map((q, i) => {
        if (i === activeQuestionIndex && q.answers.length < 8) {
          return {
            ...q,
            answers: [...q.answers, emptyAnswer()],
          };
        }
        return q;
      }),
    );
  };

  // Remove an answer from the active question
  const removeAnswer = (answerId) => {
    setQuestions(
      questions.map((q, i) => {
        if (i === activeQuestionIndex) {
          if (q.answers.length <= 2) {
            return q; // Don't remove if only 2 answers left
          }

          const filteredAnswers = q.answers.filter((a) => a.id !== answerId);

          // If we removed the correct answer, set the first answer as correct
          const hasCorrectAnswer = filteredAnswers.some((a) => a.isCorrect);

          if (!hasCorrectAnswer) {
            filteredAnswers[0].isCorrect = true;
            return {
              ...q,
              answers: filteredAnswers,
              correctAnswerIndex: 0,
            };
          }

          // Update correctAnswerIndex if needed
          const newCorrectIndex = filteredAnswers.findIndex((a) => a.isCorrect);

          return {
            ...q,
            answers: filteredAnswers,
            correctAnswerIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
          };
        }
        return q;
      }),
    );
  };

  // Navigate to next step
  const nextStep = async () => {
    if (step === 1) {
      // Validate quiz info
      if (!quizTitle.trim()) {
        setError('Please enter a quiz title');
        return;
      }
      if (!coverImageFile) {
        setError('Please upload a cover image');
        return;
      }

      setError('');
      setStep(2);
    } else if (step === 2) {
      // Validate questions
      const allQuestionsValid = questions.every((q) => {
        if (!q.title.trim()) return false;
        if (!q.imageFile) return false;
        if (q.answers.some((a) => !a.text.trim())) return false;
        if (!q.answers.some((a) => a.isCorrect)) return false;
        return true;
      });

      if (!allQuestionsValid) {
        setError(
          'Please complete all questions with title, image, answers, and mark a correct answer for each',
        );
        return;
      }

      setError('');
      setStep(3);
    }
  };

  // Go back to previous step
  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Upload cover image
      const coverImageAssetId = await uploadImage(coverImageFile);

      // Upload all question images and create question documents
      const questionPromises = questions.map(async (question) => {
        const questionImageAssetId = await uploadImage(question.imageFile);

        return {
          title: question.title,
          imageAssetId: questionImageAssetId,
          answers: question.answers.map((a) => ({
            text: a.text,
            color: a.color,
            isCorrect: a.isCorrect,
          })),
        };
      });

      const processedQuestions = await Promise.all(questionPromises);

      // Create the quiz with references to all questions
      await createQuiz({
        title: quizTitle,
        description: quizDescription,
        coverImageAssetId,
        questions: processedQuestions,
      });

      // Show success message
      setSuccess(true);

      // Navigate to the dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err.message || 'Failed to create quiz');
      setIsSubmitting(false);
    }
  };

  // Predefined colors for answers
  const predefinedColors = [
    '#ef4444', // red
    '#a16207', // amber
    '#38bdf8', // sky
    '#6366f1', // indigo
    '#e879f9', // fuchsia
    '#fb7185', // rose
    '#22c55e', // green
    '#4338ca', // indigo-dark
  ];

  // Render form based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="overflow-hidden shadow-xl bg-gradient-to-b from-indigo-900/90 to-purple-900/80 rounded-xl backdrop-blur-sm">
              <div className="p-4 font-bold text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                Quiz Information
              </div>

              <div className="p-6 space-y-6">
                {/* Quiz Title */}
                <div>
                  <label
                    htmlFor="quizTitle"
                    className="block mb-2 text-lg font-medium text-white"
                  >
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    id="quizTitle"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full p-3 text-white transition-all bg-white border-2 rounded-lg bg-opacity-10 border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                {/* Quiz Description */}
                <div>
                  <label
                    htmlFor="quizDescription"
                    className="block mb-2 text-lg font-medium text-white"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="quizDescription"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    className="w-full p-3 text-white transition-all bg-white border-2 rounded-lg bg-opacity-10 border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter a description for your quiz"
                    rows={3}
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block mb-2 text-lg font-medium text-white">
                    Quiz Cover Image
                  </label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg border-purple-500/30">
                    {coverImagePreview ? (
                      <div className="relative w-full mb-4 overflow-hidden rounded-lg">
                        <img
                          src={coverImagePreview}
                          alt="Cover Preview"
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageFile(null);
                            setCoverImagePreview('');
                            if (fileInputRef.current)
                              fileInputRef.current.value = '';
                          }}
                          className="absolute p-2 text-white rounded-full top-2 right-2 bg-red-600/80 hover:bg-red-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center w-full mb-4 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg
                          className="w-12 h-12 mb-2 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-lg text-purple-200">
                          Click to upload cover image
                        </p>
                        <p className="text-sm text-purple-300">
                          (PNG, JPG, WEBP)
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                    />

                    {!coverImagePreview && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-2 font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Cover Image
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <motion.button
                type="button"
                className="px-6 py-3 font-bold text-white transition-colors rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
              >
                Continue to Questions
              </motion.button>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="overflow-hidden shadow-xl bg-gradient-to-b from-indigo-900/90 to-purple-900/80 rounded-xl backdrop-blur-sm">
              <div className="p-4 font-bold text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                Question {activeQuestionIndex + 1}
              </div>

              <div className="p-6">
                {/* Question Title */}
                <div className="mb-6">
                  <label
                    htmlFor={`question-title-${activeQuestion.id}`}
                    className="block mb-2 text-lg font-medium text-white"
                  >
                    Question Title
                  </label>
                  <input
                    type="text"
                    id={`question-title-${activeQuestion.id}`}
                    value={activeQuestion.title}
                    onChange={(e) => updateQuestionTitle(e.target.value)}
                    className="w-full p-3 text-white transition-all bg-white border-2 rounded-lg bg-opacity-10 border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your question"
                    required
                  />
                </div>

                {/* Question Image Upload */}
                <div className="mb-6">
                  <label className="block mb-2 text-lg font-medium text-white">
                    Question Image
                  </label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg border-purple-500/30">
                    {activeQuestion.imagePreview ? (
                      <div className="relative w-full mb-4 overflow-hidden rounded-lg">
                        <img
                          src={activeQuestion.imagePreview}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions(
                              questions.map((q, i) =>
                                i === activeQuestionIndex
                                  ? { ...q, imageFile: null, imagePreview: '' }
                                  : q,
                              ),
                            );
                            if (
                              questionFileInputRefs.current[activeQuestion.id]
                            ) {
                              questionFileInputRefs.current[
                                activeQuestion.id
                              ].value = '';
                            }
                          }}
                          className="absolute p-2 text-white rounded-full top-2 right-2 bg-red-600/80 hover:bg-red-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center w-full mb-4 cursor-pointer"
                        onClick={() =>
                          questionFileInputRefs.current[
                            activeQuestion.id
                          ]?.click()
                        }
                      >
                        <svg
                          className="w-12 h-12 mb-2 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-lg text-purple-200">
                          Click to upload image
                        </p>
                        <p className="text-sm text-purple-300">
                          (PNG, JPG, WEBP)
                        </p>
                      </div>
                    )}

                    <input
                      ref={(el) =>
                        (questionFileInputRefs.current[activeQuestion.id] = el)
                      }
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        handleQuestionImageChange(activeQuestion.id, e)
                      }
                    />

                    {!activeQuestion.imagePreview && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-4 py-2 font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                        onClick={() =>
                          questionFileInputRefs.current[
                            activeQuestion.id
                          ]?.click()
                        }
                      >
                        Select Image
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Answer Options */}
                <div className="mb-6">
                  <label className="block mb-4 text-lg font-medium text-white">
                    Answer Options
                  </label>

                  <div className="space-y-4">
                    {activeQuestion.answers.map((answer, index) => (
                      <motion.div
                        key={answer.id}
                        layout
                        className="flex flex-col p-4 space-y-2 rounded-lg md:flex-row md:space-y-0 md:space-x-4 bg-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Radio button for correct answer */}
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`correct-${answer.id}`}
                            name={`correctAnswer-${activeQuestion.id}`}
                            checked={
                              index === activeQuestion.correctAnswerIndex
                            }
                            onChange={() => handleSetCorrectAnswer(index)}
                            className="w-5 h-5 text-purple-600 border-gray-300 cursor-pointer focus:ring-purple-500"
                          />
                          <label
                            htmlFor={`correct-${answer.id}`}
                            className="ml-2 text-sm font-medium text-white cursor-pointer"
                          >
                            Correct
                          </label>
                        </div>

                        {/* Answer text input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={answer.text}
                            onChange={(e) =>
                              handleAnswerTextChange(answer.id, e.target.value)
                            }
                            className="w-full p-2 text-white transition-all bg-white border rounded-lg bg-opacity-10 border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Answer option"
                          />
                        </div>

                        {/* Color picker */}
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-wrap gap-1">
                            {predefinedColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded-full ${answer.color === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  handleColorChange(answer.id, color)
                                }
                              />
                            ))}
                          </div>

                          {/* Delete answer button */}
                          {activeQuestion.answers.length > 2 && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-white rounded-full bg-red-500/80 hover:bg-red-600"
                              onClick={() => removeAnswer(answer.id)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add More Answers Button */}
                  {activeQuestion.answers.length < 8 && (
                    <motion.button
                      type="button"
                      className="flex items-center justify-center w-full p-3 mt-4 font-medium text-white transition-colors rounded-lg bg-indigo-600/70 hover:bg-indigo-600"
                      onClick={addAnswer}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Answer Option
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky question navigation header */}
            <div className="sticky top-0 z-10 p-4 my-6 shadow-lg bg-gradient-to-b from-indigo-900/95 to-purple-900/95 rounded-xl backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left side: Question pagination */}
                <div className="flex items-center">
                  <h2 className="mr-4 text-xl font-bold text-white">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </h2>

                  <div className="flex max-w-xs p-1 space-x-1 overflow-x-auto md:max-w-md scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
                    {questions.map((q, index) => (
                      <motion.button
                        key={q.id}
                        type="button"
                        className={`flex-shrink-0 w-8 h-8 text-sm font-medium text-white rounded-full flex items-center justify-center ${
                          index === activeQuestionIndex
                            ? 'bg-purple-600 shadow-lg shadow-purple-600/30'
                            : 'bg-purple-600/50 hover:bg-purple-600/70'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveQuestionIndex(index)}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Right side: Add/Delete buttons */}
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addQuestion}
                  >
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Question
                    </span>
                  </motion.button>

                  {questions.length > 1 && (
                    <motion.button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => removeQuestion(activeQuestion.id)}
                    >
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete Question
                      </span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <motion.button
                type="button"
                className="px-6 py-3 font-bold text-white transition-colors bg-gray-600 rounded-lg shadow-lg hover:bg-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
              >
                Back to Quiz Info
              </motion.button>

              <motion.button
                type="button"
                className="px-6 py-3 font-bold text-white transition-colors rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
              >
                Review & Finish
              </motion.button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="overflow-hidden shadow-xl bg-gradient-to-b from-indigo-900/90 to-purple-900/80 rounded-xl backdrop-blur-sm">
              <div className="p-4 font-bold text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                Review Your Quiz
              </div>

              <div className="p-6 space-y-6">
                {/* Quiz overview */}
                <div className="p-4 rounded-lg bg-white/10">
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {quizTitle}
                  </h3>

                  {quizDescription && (
                    <p className="mb-4 text-white/80">{quizDescription}</p>
                  )}

                  {coverImagePreview && (
                    <div className="w-full overflow-hidden rounded-lg">
                      <img
                        src={coverImagePreview}
                        alt="Quiz Cover"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>

                {/* Questions summary */}
                <div>
                  <h3 className="mb-3 text-lg font-medium text-white">
                    Questions ({questions.length})
                  </h3>

                  <div className="space-y-3">
                    {questions.map((question, idx) => (
                      <div
                        key={question.id}
                        className="flex p-3 rounded-lg bg-white/10"
                      >
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3 font-bold text-white rounded-full bg-indigo-600/60">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {question.title}
                          </p>
                          <p className="text-sm text-white/70">
                            {question.answers.length} answer options
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <motion.button
                type="button"
                className="px-6 py-3 font-bold text-white transition-colors bg-gray-600 rounded-lg shadow-lg hover:bg-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
              >
                Back to Questions
              </motion.button>

              <motion.button
                type="submit"
                className="px-6 py-3 font-bold text-white transition-colors rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 mr-3 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Creating Quiz...
                  </div>
                ) : (
                  'Create Quiz'
                )}
              </motion.button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-screen px-4 py-6 md:px-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-center mb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <h1 className="mr-4 text-4xl font-extrabold leading-none tracking-tight text-white md:text-5xl lg:text-6xl">
          Create Quiz
        </h1>
        <motion.img
          className="w-16 h-16 md:w-20 md:h-20"
          src={logo1}
          alt="Quizazoid logo"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Step indicators */}
      <div className="flex items-center justify-center w-full max-w-4xl mx-auto mb-6">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex-1 w-full">
            <div className="flex items-center w-full">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                {step > stepNumber ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-white">{stepNumber}</span>
                )}
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  stepNumber < 3
                    ? step > stepNumber
                      ? 'bg-purple-600'
                      : 'bg-gray-600'
                    : 'hidden'
                }`}
              />
            </div>
            <div className="mt-1 text-xs text-center text-white">
              {stepNumber === 1
                ? 'Quiz Info'
                : stepNumber === 2
                  ? 'Questions'
                  : 'Review'}
            </div>
          </div>
        ))}
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="w-full max-w-4xl p-4 mb-4 text-white bg-red-600 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="w-full max-w-4xl p-4 mb-4 text-white bg-green-600 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Quiz created successfully! Redirecting to dashboard...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderStepContent()}
      </motion.div>
    </div>
  );
}
