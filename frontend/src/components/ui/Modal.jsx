import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-[#173B78]/80 backdrop-blur-xs z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${maxWidth} bg-white dark:bg-[#0F1A33] rounded-3xl shadow-sm border border-[#E5E1D8] dark:border-[#1E2D52] relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-hidden`}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#E5E1D8] shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-[#18315E] dark:text-white font-serif">{title}</h2>
            {subtitle && (
              <p className="text-sm text-[#60708B] mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-[#F3F0EA] text-[#60708B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

