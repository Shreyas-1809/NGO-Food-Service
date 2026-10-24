import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Package, 
  ChevronRight, 
  ArrowRight, 
  Home
} from 'lucide-react';

const STEPS = [
  {
    id: 'surplus',
    stepNumber: 1,
    title: 'Surplus Feed',
    subtitle: 'Browse & Claim Surplus Food',
    path: '/',
    icon: Package
  }
];

const WorkflowNav = ({ activeStep, customBreadcrumb = null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep || location.pathname === s.path);

  return (
    <div className="w-full mb-6 space-y-3">
      {/* Top Contextual Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-medium text-[#60708B] dark:text-slate-300">
        <Link 
          to="/" 
          className="flex items-center hover:text-[#18315E] dark:hover:text-[#D9B65D] transition-colors"
        >
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#60708B] dark:text-slate-300" />
        <span className="text-[#18315E] dark:text-white font-semibold">
          Donation Bridge Flow
        </span>
        {customBreadcrumb && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#60708B] dark:text-slate-300" />
            <span className="text-[#18315E] dark:text-[#D9B65D] font-bold">
              {customBreadcrumb}
            </span>
          </>
        )}
      </div>

      {/* 3-Step Interactive Pipeline Bar */}
      <div className="bg-white dark:bg-[#0F1A33] rounded-2xl p-2 sm:p-2.5 shadow-sm border border-[#E5E1D8] dark:border-[#1E2D52]">
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
                    ? 'bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xs'
                    : 'hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#173B78] text-white shadow-sm'
                        : isCompleted
                        ? 'bg-[#F3F0EA] dark:bg-[#0F1A33]/60 text-[#18315E] dark:text-[#D9B65D]'
                        : 'bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#60708B] dark:text-slate-300 group-hover:bg-[#F3F0EA]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708B] dark:text-slate-300">
                        Step {step.stepNumber}
                      </span>
                      {isActive && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#173B78] animate-pulse" />
                      )}
                    </div>
                    <div className={`text-xs font-bold truncate ${
                      isActive 
                        ? 'text-[#18315E] dark:text-white' 
                        : 'text-[#18315E] dark:text-slate-300'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-[#60708B] dark:text-slate-300 group-hover:text-[#18315E] transition-colors pl-2">
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








