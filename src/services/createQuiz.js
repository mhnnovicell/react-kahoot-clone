import { client } from './sanityClient';

export const createQuiz = async (quizData) => {
  try {
    // First, create all the question documents
    const questionPromises = quizData.questions.map(async (question) => {
      return client.create({
        _type: 'questions', // Using your existing document type
        title: question.title,
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: question.imageAssetId,
          },
        },
        Questions: question.answers.map((answer, answerIndex) => ({
          _key: `answer_${answerIndex}`,
          answer: answer.text,
          backgroundColor: { hex: answer.color },
          korrekt: answer.isCorrect,
        })),
      });
    });

    const createdQuestions = await Promise.all(questionPromises);

    // Then create the quiz that references these questions
    const document = await client.create({
      _type: 'quiz',
      title: quizData.title,
      description: quizData.description,
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: quizData.coverImageAssetId,
        },
      },
      // Add _key to each reference in the questions array
      questions: createdQuestions.map((question, index) => ({
        _key: `question_${index}`,
        _type: 'reference',
        _ref: question._id,
      })),
    });

    return document;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

export const uploadImage = async (file) => {
  try {
    const asset = await client.assets.upload('image', file);
    return asset._id;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
