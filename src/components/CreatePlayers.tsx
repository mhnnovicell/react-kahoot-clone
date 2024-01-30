export default function CreatePlayers() {
  return (
    <div className='flex items-center justify-center p-4 mt-5 rounded-xl sm:mt-10 md:p-10'>
      <form className='w-full '>
        <div className='mb-5'>
          <h1 className='mb-10 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'>
            OwlHoot🦉
          </h1>
          <p className='mb-4 text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white'>
            Players:
          </p>
          <span
            id='badge-dismiss-green'
            className='inline-flex items-center px-2 py-1 text-sm font-medium text-green-800 bg-green-100 rounded me-2 dark:bg-green-900 dark:text-green-300'
          >
            Green
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
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6'
                />
              </svg>
              <span className='sr-only'>Remove badge</span>
            </button>
          </span>
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
