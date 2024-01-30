import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://emlynmhrnmephemzdehn.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbHlubWhybm1lcGhlbXpkZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2MjIyODIsImV4cCI6MjAyMjE5ODI4Mn0.8xCLIDhvutgdpB4l1rGKV00Sf3MoPGMKKCsqblZAYk4';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CreatePlayers() {
  const [value, setValue] = useState('');
  const [displayValues, setDisplayValues] = useState([]);

  useEffect(() => {
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players' },
        (payload: any) => {
          setDisplayValues((prevValues) => [...prevValues, payload.new.name]);
          console.log('Change received!', payload);
        }
      )
      .subscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('players')
      .insert([{ name: value }]);

    if (error) {
      console.error(error);
    }
  };

  return (
    <div className='flex items-center justify-center p-4 mt-5 rounded-xl sm:mt-10 md:p-10'>
      <form className='w-full' onSubmit={handleSubmit}>
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
              className='inline-flex items-center px-2 py-1 text-sm font-medium text-green-800 bg-green-100 rounded me-2 dark:bg-green-900 dark:text-green-300'
            >
              {value}
              <button
                type='button'
                className='inline-flex items-center p-1 text-sm text-green-400 bg-transparent rounded-sm ms-2 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-300'
                data-dismiss-target='#badge-dismiss-green'
                aria-label='Remove'
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
            placeholder='Mikkel'
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button
          type='submit'
          className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
        >
          Bekræft
        </button>
      </form>
    </div>
  );
}
