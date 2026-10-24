import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-full max-w-md',
  confirmClose = false,
  confirmMessage = 'Are you sure you want to close? Any unsaved changes will be lost.',
  icon: Icon
}) => {
const handleClose = useCallback(() => {
    if (confirmClose) {
      if (window.confirm(confirmMessage)) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [confirmClose, confirmMessage, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#173B78]/80 backdrop-blur-xs z-[100] flex justify-end animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={`${width} bg-white dark:bg-[#0F1A33] rounded-3xl shadow-sm border border-[#E5E1D8] dark:border-[#1E2D52] h-full flex flex-col animate-in slide-in-from-right duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#E5E1D8] shrink-0">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-[#E5B85C]" />}
            <div>
              <h2 className="text-xl font-extrabold text-[#18315E] dark:text-white font-serif">{title}</h2>
              {subtitle && (
                <p className="text-sm text-[#60708B] mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-[#F3F0EA] text-[#60708B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;


