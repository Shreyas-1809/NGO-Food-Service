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

  if (variant === 'circular') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* Call Button */}
        {telUrl && (
          <a
            href={telUrl}
            className="w-10 h-10 rounded-full bg-[#eff6ff] hover:bg-[#dbeafe] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#2563eb] dark:text-blue-400 flex items-center justify-center transition-all shadow-2xs hover:scale-105"
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
            className="w-10 h-10 rounded-full bg-[#dcfce7] hover:bg-[#bbf7d0] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-[#166534] dark:text-emerald-400 flex items-center justify-center transition-all shadow-2xs hover:scale-105"
            title={`WhatsApp ${name}: ${phone}`}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}

        {/* Email Button */}
        {mailtoUrl && (
          <a
            href={mailtoUrl}
            className="w-10 h-10 rounded-full bg-[#eff6ff] hover:bg-[#dbeafe] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#2563eb] dark:text-blue-400 flex items-center justify-center transition-all shadow-2xs hover:scale-105"
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
          className={`inline-flex items-center gap-1 font-bold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-all shadow-2xs hover:shadow-xs active:scale-95 ${btnPadding}`}
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

