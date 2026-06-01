import { useState, useEffect } from 'react';
import { Phone } from 'react-feather';

const API = import.meta.env.VITE_API_URL;

export default function Locations() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetch(`${API}/branches`)
      .then(r => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  if (!branches.length) return null;

  return (
    <div className="mt-12 mb-12">
      <h2 className="text-red-500 text-3xl font-bold text-center mb-8">
        Nuestras Sucursales
      </h2>
      <div className={`flex flex-wrap justify-center gap-4`}>
        {branches.map(branch => (
          <div key={branch._id}
            className="rounded-2xl p-6 text-center w-full max-w-sm border border-white/5"
            style={{ background: 'linear-gradient(160deg,#1c1c2e,#0e0e18)' }}>
            <h3 className="text-red-500 text-xl font-bold mb-2">{branch.name}</h3>
            {branch.address && (
              <p className="text-gray-400 text-sm mb-4">{branch.address}</p>
            )}
            <div className="space-y-2">
              {branch.phones?.map((phone, i) => (
                <div key={i} className="flex items-center justify-center space-x-2">
                  <Phone className="text-gray-400 w-4 h-4" />
                  <a href={`tel:${phone}`} className="text-gray-300">{phone}</a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
