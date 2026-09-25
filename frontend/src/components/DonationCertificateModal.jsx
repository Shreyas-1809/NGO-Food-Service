import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Download, Printer, Share2, X, CheckCircle2, ShieldCheck, HeartHandshake, Calendar, Package, Building2, User } from 'lucide-react';
import { T } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DonationCertificateModal = ({ isOpen, onClose, foodId, initialData }) => {
  const [certData, setCertData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !foodId) return;
    if (initialData) {
      setCertData(initialData);
      setLoading(false);
      return;
    }

    const fetchCert = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_URL}/api/food/${foodId}/certificate`);
        setCertData(res.data);
      } catch (err) {
        console.error('Failed to load certificate:', err);
        setError('Unable to load certificate details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [isOpen, foodId, initialData]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const shareText = certData
    ? `I received an Official Food Donation Certificate from FoodBridge for donating ${certData.quantity} of "${certData.itemTitle}" to ${certData.ngoName}!`
    : 'FoodBridge Donation Certificate';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="print:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800 dark:text-white text-sm">Donation Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Share Certificate on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 flex justify-center bg-slate-100 dark:bg-slate-950">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Generating your official certificate...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-rose-500 text-sm">{error}</div>
          ) : certData ? (
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-8 border-double border-amber-600/40 dark:border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative text-center space-y-5 print:shadow-none print:border-black print:m-0">
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 text-amber-500 text-xs font-serif opacity-70">❖</div>
              <div className="absolute top-2 right-2 text-amber-500 text-xs font-serif opacity-70">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-500 text-xs font-serif opacity-70">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-500 text-xs font-serif opacity-70">❖</div>

              {/* Organization Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mb-1">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h4 className="text-xs uppercase font-extrabold tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
                  FoodBridge Impact Network
                </h4>
                <h1 className="text-xl md:text-2xl font-serif font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Certificate of Appreciation
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Presented in honor of verified surplus food donation
                </p>
              </div>

              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto"></div>

              {/* Recipient Donor Name */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proudly Awarded To</span>
                <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white underline decoration-amber-500/60 decoration-2 underline-offset-4">
                  {certData.donorName}
                </h2>
              </div>

              {/* Donation Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-left">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Donated Item</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">{certData.itemTitle} ({certData.quantity})</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Beneficiary Organization</span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{certData.ngoName}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered On</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">{certData.deliveredDate}</span>
                </div>
              </div>

              {/* Thank You Note */}
              <p className="text-xs text-slate-600 dark:text-slate-300 italic px-4 leading-relaxed">
                "{certData.thankYouMessage}"
              </p>

              {/* Bottom Official Signoff & Seal */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end text-left">
                <div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Delivery</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Ref: {certData.certificateNumber}
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/80 flex items-center justify-center text-amber-500 mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Official Seal</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DonationCertificateModal;
