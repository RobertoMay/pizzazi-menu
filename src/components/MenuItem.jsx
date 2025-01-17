import React from 'react';

export default function MenuItem({ item }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 shadow-lg transition-transform hover:scale-102">
      <div className="flex justify-between items-start mb-2">
        <h3
          className="text-white text-lg font-bold"
          style={{ fontSize: '1.45rem' }}
        >
          {item.name}
        </h3>
        {!item.options && (
          <span className="text-yellow-400 font-bold">${item.price}</span>
        )}
      </div>

      {item.image && (
        <div className="flex justify-center mb-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-full  h-auto object-cover rounded-full"
          />
        </div>
      )}

      {item.description && (
        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
      )}

      {item.options && (
        <div className="space-y-2">
          {item.options.map((option, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-300">{option.name}</span>
              <span className="text-yellow-400 font-bold">${option.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
