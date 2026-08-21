import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Check, Copy, X, Building2 } from 'lucide-react';

const ContactNgoModal = ({ ngo, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!ngo) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const phone = ngo.phone || ngo.contactPhone || '+91 98220 11223';
  const email = ngo.email || 'contact@ngo-partner.org';
  const website = ngo.website || '';
  const address = ngo.address || (ngo.area && ngo.city ? `${ngo.area}, ${ngo.city}` : 'Pune Hub');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-blue-500/10 dark:from-teal-500/20 dark:to-blue-500/20 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                Verified Organisation Contact
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {ngo.name || ngo.ngoName}
              </h3>
            </div>
          </div>
        </div>

        {/* Contact Details List */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use these verified contact channels for direct inter-organisation logistics coordination and surplus redistribution.
          </p>

          <div className="space-y-3">
            {/* Phone */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone Number</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <a
                  href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  Call
                </a>
                <button
                  onClick={() => handleCopy(phone, 'phone')}
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 cursor-pointer"
                  title="Copy Phone"
                >
                  {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate mr-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">{email}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <a
                  href={`mailto:${email}`}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  Email
                </a>
                <button
                  onClick={() => handleCopy(email, 'email')}
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 cursor-pointer"
                  title="Copy Email"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Hub Location</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{address}</span>
                </div>
              </div>
            </div>

            {/* Website (if available) */}
            {website && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate mr-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Official Portal</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">{website}</span>
                  </div>
                </div>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 text-slate-800 dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                >
                  Visit
                </a>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactNgoModal;
