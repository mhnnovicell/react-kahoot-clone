import { lazy } from 'react';

const Podium = lazy(() => import('../components/Podium'));

export default function QuestionsPage() {
  return <Podium />;
}
