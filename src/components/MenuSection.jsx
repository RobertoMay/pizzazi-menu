import React from 'react';
import MenuItem from './MenuItem';

export default function MenuSection({ section }) {
  const isPizzaSection = section.title === 'Pizzas';

  return (
    <div className="mb-8">
      {!isPizzaSection && (
        <h2 className="text-red-500 text-2xl font-bold mb-4">
          {section.title}
        </h2>
      )}
      <div
        className={`grid grid-cols-1 ${
          isPizzaSection ? 'sm:grid-cols-2 md:grid-cols-3' : 'md:grid-cols-2'
        } gap-4`}
      >
        {section.items.map((item, index) => (
          <MenuItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
}
