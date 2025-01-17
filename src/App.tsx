import React, { useState } from 'react';
import { menuData, locations } from './data/menu';
import Header from './components/Header';
import Navigation from './components/Navigation';
import MenuSection from './components/MenuSection';
import Locations from './components/Locations';

function App() {
  const [activeTab, setActiveTab] = useState('pizzas');

  const pizzaSections = menuData.filter(section => section.title === 'Pizzas');
  const otherSections = menuData.filter(section => section.title !== 'Pizzas');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="space-y-12">
          {activeTab === 'pizzas' ? (
            pizzaSections.map((section, index) => (
              <MenuSection key={index} section={section} />
            ))
          ) : (
            otherSections.map((section, index) => (
              <MenuSection key={index} section={section} />
            ))
          )}
        </div>

        <Locations locations={locations} />
      </div>
    </div>
  );
}

export default App;