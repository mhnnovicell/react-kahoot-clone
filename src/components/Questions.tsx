export default function Questions() {
  return (
    <div className='flex flex-col items-center w-full h-full mb-4'>
      <h2 className='mb-10 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white'>
        Hvem i gruppen har haft flest sexpartnere?
      </h2>
      <form className='flex flex-col items-center justify-center w-full h-full'>
        <div className='flex w-1/2 my-4'>
          <button className='w-full h-full p-20 m-4 text-4xl font-extrabold leading-none tracking-tight text-white bg-red-600 rounded-lg shadow '>
            <span>👌</span> svar 1
          </button>
          <button className='w-full h-full p-20 m-4 text-4xl font-extrabold leading-none tracking-tight text-white rounded-lg shadow bg-lime-600'>
            <span>😘</span> Test 2
          </button>
        </div>
        <div className='flex w-1/2 my-4'>
          <button className='w-full h-full p-20 m-4 text-4xl font-extrabold leading-none tracking-tight text-white rounded-lg shadow bg-sky-700'>
            <span>🍆</span> Test 3
          </button>
          <button className='w-full h-full p-20 m-4 text-4xl font-extrabold leading-none tracking-tight text-white rounded-lg shadow bg-fuchsia-700'>
            <span>💯</span> Test 4
          </button>
        </div>
      </form>
    </div>
  );
}
