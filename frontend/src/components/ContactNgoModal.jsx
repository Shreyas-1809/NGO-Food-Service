import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Check, Copy, Building2, MessageCircle } from 'lucide-react';
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
          <p className="text-xs text-[#60708B] dark:text-slate-300">
            Use these verified contact channels for direct inter-organisation logistics coordination and surplus redistribution.
          </p>

          <div className="space-y-3">
            {/* Phone & WhatsApp */}
            <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-[#D9B65D] rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#60708B] block uppercase">Phone / Mobile</span>
                  <span className="text-xs font-bold text-[#18315E] dark:text-white">
                    {phone || <span className="italic font-normal text-[#60708B]">Not provided</span>}
                  </span>
                </div>
              </div>
              {phone ? (
                <div className="flex items-center space-x-1.5">
                  {telUrl && (
                    <a
                      href={telUrl}
                      className="px-2.5 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
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
                      className="px-2.5 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(phone, 'phone')}
                    className="p-1.5 text-[#60708B] hover:text-[#18315E] dark:hover:text-[#ECE9E1] bg-white dark:bg-[#0F1A33] rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-[#18315E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-[#60708B] italic">Unavailable</span>
              )}
            </div>

            {/* Email */}
            <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52] flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate mr-2">
                <div className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-[#D9B65D] rounded-xl shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-[#60708B] block uppercase">Email Address</span>
                  <span className="text-xs font-bold text-[#18315E] dark:text-white truncate block">
                    {email || <span className="italic font-normal text-[#60708B]">Not provided</span>}
                  </span>
                </div>
              </div>
              {email ? (
                <div className="flex items-center space-x-1.5 shrink-0">
                  {mailtoUrl && (
                    <a
                      href={mailtoUrl}
                      className="px-2.5 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(email, 'email')}
                    className="p-1.5 text-[#60708B] hover:text-[#18315E] dark:hover:text-[#ECE9E1] bg-white dark:bg-[#0F1A33] rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-[#18315E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-[#60708B] italic">Unavailable</span>
              )}
            </div>

            {/* Address */}
            <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-[#D9B65D] rounded-xl">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#60708B] block uppercase">Hub Location</span>
                  <span className="text-xs font-bold text-[#18315E] dark:text-white">{address}</span>
                </div>
              </div>
            </div>

            {/* Website (if available) */}
            {website && (
              <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52] flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate mr-2">
                  <div className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#E5B85C] dark:text-[#D9B65D] rounded-xl shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-[#60708B] block uppercase">Official Portal</span>
                    <span className="text-xs font-bold text-[#18315E] dark:text-white truncate block">{website}</span>
                  </div>
                </div>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#173B78] text-[#18315E] dark:text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
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










