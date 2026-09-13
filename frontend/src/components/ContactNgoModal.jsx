import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Check, Copy, X, Building2, MessageCircle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { getTelLink, getWhatsAppLink, getMailtoLink } from '../utils/contactLinks';

const ContactNgoModal = ({ ngo, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!ngo) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const phone = ngo.phone || ngo.contactPhone || '';
  const email = ngo.email || '';
  const website = ngo.website || '';
  const address = ngo.address || (ngo.area && ngo.city ? `${ngo.area}, ${ngo.city}` : 'Pune Hub');
  const ngoName = ngo.name || ngo.ngoName || 'NGO Partner';

  const telUrl = getTelLink(phone);
  const waUrl = getWhatsAppLink(phone, `Hello ${ngoName}, I am contacting you through FoodBridge regarding food logistics.`);
  const mailtoUrl = getMailtoLink(email, `FoodBridge Surplus Coordination with ${ngoName}`);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={ngoName}
      subtitle="Verified Organisation Contact"
      icon={Building2}
      width="w-full max-w-md"
    >
      <div className="space-y-4 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use these verified contact channels for direct inter-organisation logistics coordination and surplus redistribution.
          </p>

          <div className="space-y-3">
            {/* Phone & WhatsApp */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone / Mobile</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {phone || <span className="italic font-normal text-slate-400">Not provided</span>}
                  </span>
                </div>
              </div>
              {phone ? (
                <div className="flex items-center space-x-1.5">
                  {telUrl && (
                    <a
                      href={telUrl}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Call NGO"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  )}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(phone, 'phone')}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Unavailable</span>
              )}
            </div>

            {/* Email */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate mr-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {email || <span className="italic font-normal text-slate-400">Not provided</span>}
                  </span>
                </div>
              </div>
              {email ? (
                <div className="flex items-center space-x-1.5 shrink-0">
                  {mailtoUrl && (
                    <a
                      href={mailtoUrl}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(email, 'email')}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Unavailable</span>
              )}
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
            <Button
              variant="secondary"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
      </div>
    </Modal>
  );
};

export default ContactNgoModal;
