import React from 'react';
import { Utensils, Shirt, BookOpen, Laptop, Armchair, Sparkles, HeartPulse, Smile, Home, Coins, PackagePlus } from 'lucide-react';

const CATEGORIES = [
  { id: 'Food', name: 'FOOD & GROCERIES', emoji: '🍚', icon: Utensils, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' },
  { id: 'Clothes', name: 'CLOTHING', emoji: '👕', icon: Shirt, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200' },
  { id: 'Books', name: 'BOOKS & EDUCATIONAL', emoji: '📚', icon: BookOpen, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200' },
  { id: 'Electronics', name: 'ELECTRONICS', emoji: '💻', icon: Laptop, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200' },
  { id: 'Furniture', name: 'FURNITURE', emoji: '🛏️', icon: Armchair, color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200' },
  { id: 'Hygiene', name: 'HYGIENE & PERSONAL CARE', emoji: '🧴', icon: Sparkles, color: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200' },
  { id: 'Medical Supplies', name: 'MEDICAL SUPPLIES', emoji: '💊', icon: HeartPulse, color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200' },
  { id: 'Toys', name: 'TOYS & RECREATION', emoji: '🧸', icon: Smile, color: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-200' },
  { id: 'Household', name: 'HOUSEHOLD ITEMS', emoji: '🏠', icon: Home, color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200' },
  { id: 'Monetary', name: 'MONETARY DONATION', emoji: '💰', icon: Coins, color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200' },
  { id: 'Other', name: 'OTHER RESOURCES', emoji: '📦', icon: PackagePlus, color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' }
];

const SurplusCategorySelector = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full space-y-4">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start">
          <span className="text-emerald-600 mr-2">✦</span> WHAT DO YOU HAVE IN SURPLUS?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select a surplus category below to start smart NGO matching.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 group ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30 transform scale-105'
                  : `${cat.color} border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md`
              }`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-[11px] font-extrabold tracking-tight leading-tight block">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SurplusCategorySelector;
