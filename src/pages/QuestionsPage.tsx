import { lazy } from 'react';

const Questions = lazy(() => import('../components/Questions'));

export default function QuestionsPage() {
  return (
    <>
      <Questions />
    </>
  );
}
