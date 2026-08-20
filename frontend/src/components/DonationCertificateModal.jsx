import React from 'react';
import { Award, Download, Printer, X, CheckCircle, HeartHandshake, ShieldCheck } from 'lucide-react';

const DonationCertificateModal = ({ donation, onClose }) => {
  if (!donation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Certificate Box */}
        <div id="printable-certificate" className="p-8 sm:p-12 overflow-y-auto flex-1 bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-center relative border-8 border-emerald-600/10 m-4 rounded-2xl">
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 text-emerald-600/30"><Award className="w-8 h-8"/></div>
          <div className="absolute top-3 right-3 text-emerald-600/30"><Award className="w-8 h-8"/></div>
          
          {/* Header */}
          <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Donor ↔ Receiver Bridge Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-1">
            Certificate of Social Impact
          </h2>
          <p className="text-xs uppercase tracking-widest font-semibold text-emerald-700 dark:text-emerald-400 mb-6">
            Official Verification of Completed Donation
          </p>

          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-8 rounded-full"></div>

          {/* Certificate Body */}
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            This certificate is proudly awarded in recognition of generous community contribution by:
          </p>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white my-3 tracking-tight">
            {donation.donorName || 'Generous Donor'}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
            for donating <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{donation.quantity} {donation.unit || 'kg'} of {donation.itemName || donation.title}</strong> to verified community organization:
          </p>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md mx-auto mb-8 inline-block px-8">
            <div className="flex items-center justify-center space-x-2 text-slate-900 dark:text-white font-extrabold text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{donation.matchedNgoName || 'Verified NGO Receiver'}</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center mt-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> COMPLETED & VERIFIED
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 text-left max-w-lg mx-auto">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Donation ID</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{donation.id}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Date Issued</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{new Date(donation.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Verification</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">PASSED</span>
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD DONATION CERTIFICATE</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DonationCertificateModal;
