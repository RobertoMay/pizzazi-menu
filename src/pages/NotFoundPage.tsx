import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-red-500 text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-300 text-xl mb-8">Página no encontrada</p>
      <button
        onClick={() => navigate('/')}
        className="bg-red-500 hover:bg-red-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
      >
        Ir al menú
      </button>
    </div>
  );
}
