import { Leaf } from 'lucide-react';
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 py-10 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-emerald-600 font-space-grotesk">EcoSense</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            © 2024 EcoSense. Building a sustainable future, one score at a time.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;