import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className='flex flex-col items-center justify-center w-full h-screen '>
      <h1 className='text-white '>Oops!</h1>
      <p className='text-white '>Sorry, an unexpected error has occurred.</p>
      <p className='text-white '>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
