import { lazy } from 'react';

const QuizCreator = lazy(() => import('../components/QuizCreator'));

export default function QuizCreatorPage() {
  return <QuizCreator />;
}
