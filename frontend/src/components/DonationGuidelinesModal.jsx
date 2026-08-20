import React from 'react';
import { X, ShieldAlert, CheckCircle2, Utensils, Shirt, Laptop, BookOpen, HeartPulse, Info } from 'lucide-react';

const DonationGuidelinesModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-100 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1" /> Safety & Quality Standards
            </span>
            <h2 className="text-2xl font-extrabold">DONATION GUIDELINES</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* Food Rules */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center text-emerald-700 dark:text-emerald-400">
              <Utensils className="w-4 h-4 mr-2" /> Food & Groceries Safety Rules
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Do not donate expired food.</strong> Expiry dates must be clearly visible or specified.</li>
              <li>Always mention storage conditions (Normal, Refrigerated, Frozen).</li>
              <li>Cooked food items must include preparation time and be packed in clean, sealed containers.</li>
              <li>Ensure food items are 100% safe, hygienic, and properly packed.</li>
            </ul>
          </div>

          {/* Clothing Rules */}
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center text-blue-700 dark:text-blue-400">
              <Shirt className="w-4 h-4 mr-2" /> Clothing & Footwear Rules
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Donate clean, washed, and usable clothing and blankets.</li>
              <li>Do not donate heavily damaged, torn, or unhygienic items.</li>
            </ul>
          </div>

          {/* Electronics Rules */}
          <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center text-purple-700 dark:text-purple-400">
              <Laptop className="w-4 h-4 mr-2" /> Electronics Rules
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Mention whether the item is fully working or refurbished.</li>
              <li>Mention any major defects, missing chargers, or battery health.</li>
            </ul>
          </div>

          {/* General Rules Callout */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center">
              <Info className="w-4 h-4 mr-2 text-emerald-600" /> General Donation Principles
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>Provide accurate quantity and unit counts.</li>
              <li>Upload clear images of the surplus items when possible.</li>
              <li>Provide exact, accessible pickup location details.</li>
              <li>Final acceptance is determined by the receiving organization and applicable regulatory rules.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
          >
            I UNDERSTAND & AGREE
          </button>
        </div>

      </div>
    </div>
  );
};

export default DonationGuidelinesModal;
