import { lazy } from 'react';

const EditQuiz = lazy(() => import('../components/EditQuiz'));

export default function EditQuizPage() {
  return <EditQuiz />;
}
