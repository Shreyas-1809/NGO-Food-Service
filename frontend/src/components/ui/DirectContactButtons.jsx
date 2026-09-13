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
  showCopy = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const telUrl = getTelLink(phone);
  const waUrl = getWhatsAppLink(phone, waMessage);
  const mailtoUrl = getMailtoLink(email, emailSubject);

  if (!telUrl && !waUrl && !mailtoUrl) {
    return (
      <span className="text-[11px] text-slate-400 italic">
        No contact details available
      </span>
    );
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnPadding = size === 'xs' ? 'px-2 py-1 text-[10px]' : size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Call Button */}
      {telUrl && (
        <a
          href={telUrl}
          className={`inline-flex items-center gap-1 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-2xs hover:shadow-xs active:scale-95 ${btnPadding}`}
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
          className={`inline-flex items-center gap-1 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs hover:shadow-xs active:scale-95 ${btnPadding}`}
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
          className={`inline-flex items-center gap-1 font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 transition-all shadow-2xs active:scale-95 ${btnPadding}`}
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
          className={`inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer ${btnPadding}`}
          title="Copy Phone Number"
        >
          {copied ? <Check className={`${iconSize} text-emerald-600`} /> : <Copy className={iconSize} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
};

export default DirectContactButtons;
