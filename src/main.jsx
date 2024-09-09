import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from './pages/ErrorPage.tsx';
import Page from './pages/Page';
import QuestionsPage from './pages/QuestionsPage';
import { storyblokInit, apiPlugin } from '@storyblok/react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/questions',
    element: <QuestionsPage />,
  },
]);

storyblokInit({
  accessToken: 'xCC0BnvyC2lrRBesbhslUAtt',
  use: [apiPlugin],
  components: {
    page: Page,
    questions: QuestionsPage,
  },
  apiOptions: {
    // for spaces located in the US or China:
    // region: "us" or "cn", // you need to specify the region
    region: 'eu',
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
