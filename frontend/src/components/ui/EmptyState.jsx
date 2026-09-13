import React from 'react';

const EmptyState = ({
  icon: Icon,
  message,
  action,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      {Icon && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-full mb-2">
          <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{message}</p>
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
