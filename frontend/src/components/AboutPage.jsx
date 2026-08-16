import React from 'react';
import { HeartHandshake, ShieldCheck, Sparkles, MapPin, Truck, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
          <HeartHandshake className="w-4 h-4 text-emerald-400" />
          <span>Our Core Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold max-w-3xl mx-auto leading-tight">
          "Resources shouldn't go to waste when someone nearby needs them."
        </h1>

        <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          The <strong>DONOR ↔ RECEIVER BRIDGE PLATFORM</strong> was created to eliminate logistical friction between food/resource donors and verified community organizations.
        </p>
      </div>

      {/* Startup Pipeline Architecture */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Architecture</span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            End-To-End Platform Lifecycle
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-800">
            DONOR
          </span>
          <ArrowRight className="w-4 h-4 text-emerald-500" />
          <span className="bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-4 py-2.5 rounded-2xl border border-teal-300 dark:border-teal-800">
            SMART MATCHING
          </span>
          <ArrowRight className="w-4 h-4 text-teal-500" />
          <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-4 py-2.5 rounded-2xl border border-blue-300 dark:border-blue-800">
            VERIFIED NGO
          </span>
          <ArrowRight className="w-4 h-4 text-blue-500" />
          <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-4 py-2.5 rounded-2xl border border-purple-300 dark:border-purple-800">
            DELIVERY & ROUTE
          </span>
          <ArrowRight className="w-4 h-4 text-purple-500" />
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-4 py-2.5 rounded-2xl border border-amber-300 dark:border-amber-800">
            IMPACT CERTIFICATE
          </span>
        </div>
      </div>

      {/* Key Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">100% Verification Audit</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every participating NGO undergoes multi-layer physical and regulatory verification to guarantee genuine community distribution.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <Sparkles className="w-8 h-8 text-teal-600" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Smart Match Scoring</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Our algorithm balances category urgency, distance proximity, quantity capacity, and verified trust scores in real time.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <Award className="w-8 h-8 text-amber-600" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Digital Certificates</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Donors receive printable & downloadable tax/impact receipts upon verified delivery completion.
          </p>
        </div>

      </div>

    </div>
  );
};

export default AboutPage;
