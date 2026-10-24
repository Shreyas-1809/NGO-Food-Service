import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, Copy, Check } from 'lucide-react';
import { getTelLink, getWhatsAppLink, getMailtoLink } from '../../utils/contactLinks';

/**
 * DirectContactButtons component:
 * Renders direct functioning links:
 * - tel:+<number> for calling
 * - https://wa.me/<number>?text=<encoded message> for WhatsApp
 * - mailto:<email> for emailing
 */
const DirectContactButtons = ({
  phone,
  email,
  name = 'Contact',
  waMessage,
  emailSubject,
  size = 'sm', // 'xs', 'sm', 'md'
  variant = 'default', // 'default', 'circular'
  showCopy = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const telUrl = getTelLink(phone);
  const waUrl = getWhatsAppLink(phone, waMessage);
  const mailtoUrl = getMailtoLink(email, emailSubject);

  if (!telUrl && !waUrl && !mailtoUrl) {
    return (
      <span className="text-[11px] text-[#60708B] italic">
        No contact details available
      </span>
    );
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'circular') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* Call Button */}
        {telUrl && (
          <a
            href={telUrl}
            className="w-10 h-10 rounded-full bg-[#F3F0EA] hover:bg-[#E5E1D8] text-[#18315E] flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title={`Call ${name}: ${phone}`}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        {/* WhatsApp Button */}
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-[#F3F0EA] hover:bg-[#E5E1D8] text-[#E5B85C] flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title={`WhatsApp ${name}: ${phone}`}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}

        {/* Email Button */}
        {mailtoUrl && (
          <a
            href={mailtoUrl}
            className="w-10 h-10 rounded-full bg-[#F3F0EA] hover:bg-[#E5E1D8] text-[#18315E] flex items-center justify-center transition-all shadow-sm hover:scale-105"
            title={`Email ${name}: ${email}`}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  const btnPadding = size === 'xs' ? 'px-2 py-1 text-[10px]' : size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Call Button */}
      {telUrl && (
        <a
          href={telUrl}
          className={`inline-flex items-center gap-1 font-bold rounded-full bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white transition-all shadow-sm active:scale-95 ${btnPadding}`}
          title={`Call ${name}: ${phone}`}
        >
          <Phone className={iconSize} />
          <span>Call</span>
        </a>
      )}

      {/* WhatsApp Button */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-bold rounded-full bg-[#E5B85C] hover:bg-[#F97316] text-white transition-all shadow-sm active:scale-95 ${btnPadding}`}
          title={`WhatsApp ${name}: ${phone}`}
        >
          <MessageCircle className={iconSize} />
          <span>WhatsApp</span>
        </a>
      )}

      {/* Email Button */}
      {mailtoUrl && (
        <a
          href={mailtoUrl}
          className={`inline-flex items-center gap-1 font-bold rounded-full bg-[#F3F0EA] hover:bg-[#E5E1D8] text-[#18315E] border border-[#E5E1D8] transition-all shadow-sm active:scale-95 ${btnPadding}`}
          title={`Email ${name}: ${email}`}
        >
          <Mail className={iconSize} />
          <span>Email</span>
        </a>
      )}

      {/* Copy Phone */}
      {showCopy && phone && (
        <button
          type="button"
          onClick={() => handleCopy(phone)}
          className={`inline-flex items-center gap-1 text-[#60708B] hover:text-[#18315E] bg-white border border-[#E5E1D8] rounded-lg transition-colors cursor-pointer ${btnPadding}`}
          title="Copy Phone Number"
        >
          {copied ? <Check className={`${iconSize} text-[#E5B85C]`} /> : <Copy className={iconSize} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
};

export default DirectContactButtons;



