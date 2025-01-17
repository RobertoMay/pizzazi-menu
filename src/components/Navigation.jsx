import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <div className="flex mb-8 rounded-lg overflow-hidden">
      <button
        className={`flex-1 py-3 px-6 text-lg font-semibold transition-colors ${
          activeTab === 'pizzas'
            ? 'bg-red-500 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        onClick={() => setActiveTab('pizzas')}
      >
        Pizzas
      </button>
      <button
        className={`flex-1 py-3 px-6 text-lg font-semibold transition-colors ${
          activeTab === 'other'
            ? 'bg-red-500 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        onClick={() => setActiveTab('other')}
      >
        Hamburguesas y Más
      </button>
    </div>
  );
}
