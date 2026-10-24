import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Mail, Share2 } from 'lucide-react';


const InviteOrgModal = ({ ngo, onClose }) => {
  const [copied, setCopied] = useState(false);

  const signupUrl = `${window.location.origin}/`;
  const inviteMessage = `Hi ${ngo?.name || 'Team'}, we came across your inspiring community work and would love to invite you to join FoodBridge (${signupUrl}). FoodBridge connects NGOs, food banks and shelters with donors for food surplus redistribution and zero-hunger relief. Register your organization to list active shortages and receive direct donations!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(inviteMessage);
    const phone = ngo?.phone ? ngo.phone.replace(/[^0-9]/g, '') : '';
    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invitation to join FoodBridge — Zero Hunger Network`);
    const body = encodeURIComponent(inviteMessage);
    const mailto = ngo?.email 
      ? `mailto:${ngo.email}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1830]/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0F1A33] w-full max-w-md rounded-2xl shadow-2xl border border-[#E5E1D8] dark:border-[#1E2D52] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#E5E1D8] dark:border-[#1E2D52] flex items-center justify-between bg-[#F3F0EA]/50 dark:bg-[#0F1A33]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#173B78]/10 text-[#18315E] dark:text-[#D9B65D] flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#18315E] dark:text-white">
                Invite to FoodBridge
              </h3>
              <p className="text-xs text-[#60708B] dark:text-slate-300">
                Help bring {ngo?.name || 'this organisation'} onboard
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#60708B] hover:text-[#60708B] dark:hover:text-[#ECE9E1] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/60 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] text-xs text-[#18315E] dark:text-slate-300 leading-relaxed font-mono">
            {inviteMessage}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#18315E]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Invitation to Clipboard!' : 'Copy Invitation Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteOrgModal;










