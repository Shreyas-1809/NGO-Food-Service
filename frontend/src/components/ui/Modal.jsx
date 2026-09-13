import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  confirmClose = false,
  confirmMessage = 'Are you sure you want to close? Any unsaved changes will be lost.',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (confirmClose) {
      if (window.confirm(confirmMessage)) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${maxWidth} bg-[var(--card-bg)] rounded-[12px] shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
