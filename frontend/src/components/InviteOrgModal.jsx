import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, Mail, Share2 } from 'lucide-react';
import Button from './ui/Button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Invite to FoodBridge
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help bring {ngo?.name || 'this organisation'} onboard
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            {inviteMessage}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Invitation to Clipboard!' : 'Copy Invitation Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteOrgModal;
