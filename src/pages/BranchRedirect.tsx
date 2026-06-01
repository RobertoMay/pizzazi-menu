import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBranches } from '../services/api';

interface Branch {
  _id: string;
  name: string;
  slug: string;
}

export default function BranchRedirect() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBranches()
      .then((data: Branch[]) => {
        const valid = data.filter((b) => b.slug);
        if (valid.length === 1) {
          navigate(`/${valid[0].slug}`, { replace: true });
        } else {
          setBranches(valid);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-lg">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-red-500 text-4xl font-bold mb-8">PIZZAZI</h1>
      <p className="text-gray-300 text-xl mb-8">Selecciona tu sucursal</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {branches.map((branch) => (
          <button
            key={branch._id}
            onClick={() => navigate(`/${branch.slug}`)}
            className="bg-gray-900 hover:bg-red-500 transition-colors rounded-lg p-6 text-center font-semibold text-lg"
          >
            {branch.name}
          </button>
        ))}
      </div>
    </div>
  );
}
