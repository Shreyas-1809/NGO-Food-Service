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
    <div className={`bg-white dark:bg-[#23201d] rounded-2xl border border-dashed border-[#e8dfd2] dark:border-[#38322c] p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs ${className}`}>
      {Illustration ? (
        <div className="mb-1 flex justify-center">
          {typeof Illustration === 'function' ? <Illustration className="w-36 h-36" /> : Illustration}
        </div>
      ) : Icon ? (
        <div className="w-14 h-14 rounded-full bg-[#E8873A]/10 dark:bg-[#E8873A]/20 text-[#E8873A] dark:text-[#FFAE70] flex items-center justify-center mb-1 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      ) : null}

      <div className="max-w-md space-y-1.5">
        {heading && (
          <h3 className="text-base font-extrabold text-stone-800 dark:text-stone-100">
            {heading}
          </h3>
        )}
        {description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
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
