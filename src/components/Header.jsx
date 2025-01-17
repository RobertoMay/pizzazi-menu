import React from 'react';
import { Pizza } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center py-6 mb-8">
      <div className="flex items-center justify-center gap-4">
        <img
          src="./images/logo.png"
          alt="Pizzazi Logo"
          style={{ height: '100px' }}
          className="object-cover rounded-full"
        />
        <h1 className="text-red-500 text-5xl font-bold">PIZZAZI</h1>
      </div>
    </header>
  );
}
