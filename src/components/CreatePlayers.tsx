import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Move Supabase client creation to a separate file

// Extract API calls into a separate service
import {
  fetchPlayers,
  insertPlayer,
  deletePlayer,
} from '../services/playerService';

const supabaseUrl = 'https://emlynmhrnmephemzdehn.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbHlubWhybm1lcGhlbXpkZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2MjIyODIsImV4cCI6MjAyMjE5ODI4Mn0.8xCLIDhvutgdpB4l1rGKV00Sf3MoPGMKKCsqblZAYk4';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CreatePlayers() {
  const [value, setValue] = useState('');
  const [displayValues, setDisplayValues] = useState([]);
  const [color, setColor] = useState('#000000');

  const fetchAndSetPlayers = useCallback(async () => {
    const players = await fetchPlayers();
    setDisplayValues(players);
  }, []);

  useEffect(() => {
    fetchAndSetPlayers();

    const test = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        async (payload) => {
          fetchAndSetPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(test);
    };
  }, [fetchAndSetPlayers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await insertPlayer(value, color);
  };

  const removePlayer = useCallback(async (name) => {
    console.log(name, 'name');
    await deletePlayer(name.name);
  }, []);

  return (
    <div className='flex items-center justify-center p-4 mt-5 rounded-xl sm:mt-10 md:p-10'>
      <form className='w-full'>
        <div className='mb-5'>
          <h1 className='mb-10 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'>
            OwlHoot🦉
          </h1>
          <p className='mb-4 text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white'>
            Players:
          </p>
          {displayValues.map((value, index) => (
            <span
              key={index}
              id='badge-dismiss-green'
              className='inline-flex items-center px-2 py-1 text-sm font-medium text-white rounded me-2'
              style={{ backgroundColor: value.class }}
            >
              {value.name}
              <button
                type='button'
                className='inline-flex items-center p-1 text-sm text-white bg-transparent rounded-lg ms-2 hover:bg-white hover:text-white dark:hover:bg-white dark:hover:text-black'
                data-dismiss-target='#badge-dismiss-green'
                aria-label='Remove'
                onClick={(e) => {
                  removePlayer(value);
                }}
              >
                <svg
                  className='w-2 h-2'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 14 14'
                >
                  <path
                    stroke='currentColor'
                    d='m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6'
                  />
                </svg>
                <span className='sr-only'>Remove badge</span>
              </button>
            </span>
          ))}
          <label
            htmlFor='name'
            className='block my-4 text-sm font-medium text-gray-900 dark:text-white'
          >
            Dit navn
          </label>
          <input
            type='text'
            id='name'
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            placeholder='Navn'
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <label
            htmlFor='hs-color-input'
            className='block my-4 text-sm font-medium dark:text-white'
          >
            Vælg farve
          </label>
          <input
            type='color'
            className='block w-10 h-10 p-1 bg-white border border-gray-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none '
            title='Choose your color'
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <button
          type='submit'
          onClick={handleSubmit}
          className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
        >
          Bekræft
        </button>
      </form>
    </div>
  );
}
