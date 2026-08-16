import React, { useState } from 'react';
import { Utensils, Shirt, BookOpen, Laptop, Sparkles, HeartPulse, PackagePlus, FileText, ArrowRight } from 'lucide-react';
import DonationGuidelinesModal from './DonationGuidelinesModal';

const GUIDELINE_CARDS = [
  {
    title: 'Food & Groceries',
    desc: 'Surplus groceries, packaged food, fruits, vegetables and safe consumable items.',
    icon: Utensils,
    color: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
  },
  {
    title: 'Clothing',
    desc: 'Clean and usable clothes, blankets, footwear for children, adults, and winter care.',
    icon: Shirt,
    color: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/60'
  },
  {
    title: 'Education',
    desc: 'Books, notebooks, stationery kits, school supplies, and textbook sets.',
    icon: BookOpen,
    color: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/60'
  },
  {
    title: 'Electronics',
    desc: 'Working laptops, phones, tablets, chargers, and educational digital lab accessories.',
    icon: Laptop,
    color: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/60'
  },
  {
    title: 'Essentials & Hygiene',
    desc: 'Hygiene products, soap, sanitizers, and useful household supplies.',
    icon: Sparkles,
    color: 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/60'
  },
  {
    title: 'Medical Supplies',
    desc: 'Only permitted, sealed, and safe medical supplies according to applicable health rules.',
    icon: HeartPulse,
    color: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/60'
  },
  {
    title: 'Other Resources',
    desc: 'Usable furniture, toys, recreational materials, and miscellaneous community goods.',
    icon: PackagePlus,
    color: 'border-slate-500 text-slate-600 bg-slate-50 dark:bg-slate-800'
  }
];

const WhatCanYouDonate = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="w-full space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Resource Categories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            WHAT CAN YOU DONATE?
          </h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 transition-all shadow-md"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>VIEW DONATION GUIDELINES</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {GUIDELINE_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{card.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <DonationGuidelinesModal onClose={() => setShowModal(false)} />
      )}

    </div>
  );
};

export default WhatCanYouDonate;
