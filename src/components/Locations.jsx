import React from 'react';
import { Phone } from 'react-feather';

export default function Locations({ locations }) {
  return (
    <div className="mt-12">
      <h2 className="text-red-500 text-3xl font-bold text-center mb-8">
        Nuestras Sucursales
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location, index) => (
          <div key={index} className="bg-gray-900 rounded-lg p-6 text-center">
            <h3 className="text-red-500 text-xl font-bold mb-4">
              {location.name}
            </h3>
            <div className="space-y-2">
              {location.phones.map((phone, phoneIndex) => (
                <div
                  key={phoneIndex}
                  className="flex items-center justify-center space-x-2"
                >
                  <Phone className="text-gray-400 w-4 h-4" />
                  <a href={`tel:${phone}`} className="text-gray-300">
                    {phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
