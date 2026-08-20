import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Package, 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  ArrowRight, 
  Home
} from 'lucide-react';

const STEPS = [
  {
    id: 'surplus',
    stepNumber: 1,
    title: 'Surplus Feed',
    subtitle: 'Browse & Post Food',
    path: '/',
    icon: Package
  },
  {
    id: 'shortages',
    stepNumber: 2,
    title: 'NGO Shortages',
    subtitle: 'Demand & Deficits',
    path: '/requirements',
    icon: AlertCircle
  },
  {
    id: 'map',
    stepNumber: 3,
    title: 'Logistics Map',
    subtitle: 'Hubs & Routing',
    path: '/map',
    icon: MapPin
  }
];

const WorkflowNav = ({ activeStep, customBreadcrumb = null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep || location.pathname === s.path);

  return (
    <div className="w-full mb-6 space-y-3">
      {/* Top Contextual Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link 
          to="/" 
          className="flex items-center hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        <span className="text-slate-700 dark:text-slate-200 font-semibold">
          Donation Bridge Flow
        </span>
        {customBreadcrumb && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {customBreadcrumb}
            </span>
          </>
        )}
      </div>

      {/* 3-Step Interactive Pipeline Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep || location.pathname === step.path;
            const isCompleted = currentStepIndex > idx;

            return (
              <button
                key={step.id}
                onClick={() => navigate(step.path)}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all text-left group ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Step {step.stepNumber}
                      </span>
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <div className={`text-xs font-bold truncate ${
                      isActive 
                        ? 'text-slate-900 dark:text-white' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors pl-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowNav;
