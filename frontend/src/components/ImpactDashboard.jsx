import React from 'react';
import { IMPACT_METRICS } from '../services/mockData';
import { Award, Users, HeartHandshake, Building2, PackageCheck, TrendingUp, BarChart3, PieChart } from 'lucide-react';

const ImpactDashboard = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Verified Social Impact Analytics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          COMMUNITY IMPACT DASHBOARD
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Transparent metrics tracking resource distribution, food waste reduction, and verified beneficiary empowerment across Pune.
        </p>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl">
            <PackageCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono block">12,450 kg</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resources Donated</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-teal-100 dark:bg-teal-950/80 text-teal-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono block">3,820</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Families Helped</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-950/80 text-blue-600 rounded-2xl">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono block">126</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Donors</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-950/80 text-amber-600 rounded-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono block">48</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Partner NGOs</span>
          </div>
        </div>

      </div>

      {/* VISUAL CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Donations Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" /> Monthly Donations Growth
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kilograms of surplus resources allocated per month</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> +38% MoM
            </span>
          </div>

          {/* SVG Bar Visual */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200 dark:border-slate-700">
            {IMPACT_METRICS.monthlyDonationStats.map((item, idx) => {
              const heightPct = Math.round((item.kg / 4000) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.kg} kg
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl group-hover:from-emerald-500 group-hover:to-teal-300 transition-all shadow-md"
                  ></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resource Breakdown Category Pie / Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-teal-500" /> Resource Category Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across 5 primary donation categories</p>
          </div>

          <div className="space-y-4 pt-2">
            {IMPACT_METRICS.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{cat.category}</span>
                  <span>{cat.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ImpactDashboard;
