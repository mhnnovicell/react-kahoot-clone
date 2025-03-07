import { lazy } from 'react';
import './App.css';

const CreatePlayers = lazy(() => import('./components/CreatePlayers'));

function App() {
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <CreatePlayers></CreatePlayers>
      </div>
    </>
  );
}

export default App;
