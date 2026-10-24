import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Printer, Share2, X, ShieldCheck, HeartHandshake, Calendar, Package, Building2 } from 'lucide-react';


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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#173B78]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F1A33] rounded-3xl shadow-2xl max-w-2xl w-full border border-[#E5E1D8] dark:border-[#1E2D52] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="print:hidden p-4 border-b border-[#E5E1D8] dark:border-[#1E2D52] flex justify-between items-center bg-[#F3F0EA] dark:bg-[#0F1A33]/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#E5B85C]" />
            <span className="font-bold text-[#18315E] dark:text-white text-sm">Donation Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
              className="p-1.5 text-[#60708B] hover:text-[#18315E] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 flex justify-center bg-[#F3F0EA] dark:bg-[#0F1A33]">
          {loading ? (
            <div className="text-center py-20 text-[#60708B] text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#1E293B] border-t-transparent rounded-full animate-spin"></div>
              <span>Generating your official certificate...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-[#E5B85C] text-sm">{error}</div>
          ) : certData ? (
            <div className="w-full max-w-xl bg-white dark:bg-[#0F1A33] border-8 border-double border-[#1E293B]/40 dark:border-[#1E2D52]/30 rounded-2xl p-6 md:p-8 shadow-xl relative text-center space-y-5 print:shadow-none print:border-black print:m-0">
              {/* Corner Accents */}
              <div className="absolute top-2 left-2 text-[#E5B85C] text-xs font-serif opacity-70">❖</div>
              <div className="absolute top-2 right-2 text-[#E5B85C] text-xs font-serif opacity-70">❖</div>
              <div className="absolute bottom-2 left-2 text-[#E5B85C] text-xs font-serif opacity-70">❖</div>
              <div className="absolute bottom-2 right-2 text-[#E5B85C] text-xs font-serif opacity-70">❖</div>

              {/* Organization Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] mb-1">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h4 className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#18315E] dark:text-[#D9B65D]">
                  FoodBridge Impact Network
                </h4>
                <h1 className="text-xl md:text-2xl font-serif font-black text-[#18315E] dark:text-white uppercase tracking-wider">
                  Certificate of Appreciation
                </h1>
                <p className="text-[11px] text-[#60708B] dark:text-slate-300 italic">
                  Presented in honor of verified surplus food donation
                </p>
              </div>

              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#F3F0EA] to-transparent mx-auto"></div>

              {/* Recipient Donor Name */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#60708B]">Proudly Awarded To</span>
                <h2 className="text-2xl font-bold font-serif text-[#18315E] dark:text-white underline decoration-[#E5E1D8]/60 decoration-2 underline-offset-4">
                  {certData.donorName}
                </h2>
              </div>

              {/* Donation Details */}
              <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/60 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-2 text-left">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-[#E5E1D8] dark:border-[#1E2D52]">
                  <span className="text-[#60708B] dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#18315E]" />
                    <span>Donated Item</span>
                  </span>
                  <span className="font-bold text-[#18315E] dark:text-white">{certData.itemTitle} ({certData.quantity})</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-[#E5E1D8] dark:border-[#1E2D52]">
                  <span className="text-[#60708B] dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#18315E]" />
                    <span>Beneficiary Organization</span>
                  </span>
                  <span className="font-bold text-[#18315E] dark:text-[#D9B65D]">{certData.ngoName}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#60708B] dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#18315E]" />
                    <span>Delivered On</span>
                  </span>
                  <span className="font-bold text-[#18315E] dark:text-white">{certData.deliveredDate}</span>
                </div>
              </div>

              {/* Thank You Note */}
              <p className="text-xs text-[#60708B] dark:text-slate-300 italic px-4 leading-relaxed">
                "{certData.thankYouMessage}"
              </p>

              {/* Bottom Official Signoff & Seal */}
              <div className="pt-4 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex justify-between items-end text-left">
                <div>
                  <div className="flex items-center gap-1 text-[#18315E] dark:text-[#D9B65D] font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Delivery</span>
                  </div>
                  <span className="text-[10px] text-[#60708B] font-mono block mt-0.5">
                    Ref: {certData.certificateNumber}
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#E5E1D8]/80 flex items-center justify-center text-[#E5B85C] mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-[#60708B] uppercase tracking-widest block mt-1">Official Seal</span>
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











