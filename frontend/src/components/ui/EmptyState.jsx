import React from 'react';

const EmptyState = ({
  icon: Icon,
  illustration: Illustration,
  title,
  message,
  description,
  action,
  className = ''
}) => {
  const heading = title || message;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs ${className}`}>
      {Illustration ? (
        <div className="mb-1 flex justify-center">
          {typeof Illustration === 'function' ? <Illustration className="w-36 h-36" /> : Illustration}
        </div>
      ) : Icon ? (
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      ) : null}

      <div className="max-w-md space-y-1.5">
        {heading && (
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            {heading}
          </h3>
        )}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
