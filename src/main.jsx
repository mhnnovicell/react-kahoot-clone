import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from './pages/ErrorPage.tsx';
import Loading from './components/Loading.tsx'; // Import the Loader component

const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const ScoreboardPage = lazy(() => import('./pages/ScoreboardPage'));
const PodiumPage = lazy(() => import('./pages/PodiumPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/questions/:id',
    element: (
      <Suspense fallback={<Loading />}>
        <QuestionsPage />
      </Suspense>
    ),
  },
  {
    path: '/scoreboard/:id',
    element: (
      <Suspense fallback={<Loading />}>
        <ScoreboardPage />
      </Suspense>
    ),
  },
  {
    path: '/podium',
    element: (
      <Suspense fallback={<Loading />}>
        <PodiumPage />
      </Suspense>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
