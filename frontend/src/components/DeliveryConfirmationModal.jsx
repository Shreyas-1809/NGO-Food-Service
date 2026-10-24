import React, { useState } from 'react';
import { Copy, Check, QrCode, MessageCircle, ExternalLink, ShieldCheck, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './ui/Modal';
import Button from './ui/Button';


export default function DeliveryConfirmationModal({ 
  isOpen, 
  onClose, 
  food, 
  deliveryUrl 
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  if (!food && !deliveryUrl) return null;

  const resolvedUrl = deliveryUrl || (food?._id && food?.confirmationTokens?.deliveryToken
    ? `${window.location.origin}/confirm-delivery/${food._id}?token=${food.confirmationTokens.deliveryToken}`
    : '');

  const volunteerName = food?.volunteerAssignment?.name || food?.volunteerAssignments?.[0]?.name || 'Volunteer';
  const foodTitle = food?.title || food?.itemTitle || 'Food Donation';

  const handleCopy = () => {
    if (!resolvedUrl) return;
    navigator.clipboard.writeText(resolvedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const waText = `Hello! Please use this link to confirm delivery receipt of "${foodTitle}" from volunteer (${volunteerName}): ${resolvedUrl}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Food Delivery (Receipt)"
      icon={ShieldCheck}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 py-1">
        {/* Status banner */}
        <div className="p-3 bg-sky-50 dark:bg-[#3156B5]/14 border border-sky-200 dark:border-[#3156B5]/40 rounded-xl text-sky-800 dark:text-[#ECE9E1] text-xs flex items-center gap-2.5">
          <Truck className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <p className="font-bold">Food is Out for Delivery / En Route</p>
            <p className="text-[11px] text-sky-700 dark:text-[#3156B5]/80">
              When <strong>{volunteerName}</strong> arrives at your NGO facility, use this link to confirm handover.
            </p>
          </div>
        </div>

        {/* Link Box */}
        <div className="p-3.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/90 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708B] dark:text-slate-300">
              NGO Delivery Verification Link
            </span>
            <span className="text-[10px] text-[#E5B85C] dark:text-[#D9B65D] font-bold">Single-Use Link</span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#0F1A33] p-2 rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] text-xs font-mono text-[#18315E] dark:text-slate-300 break-all select-all">
            <span className="truncate flex-1 text-[11px]">{resolvedUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] rounded-lg text-xs font-sans font-semibold text-[#18315E] dark:text-white flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#18315E]" />
                  <span className="text-[#18315E] dark:text-[#D9B65D] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] py-2 px-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </a>

            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open to Confirm</span>
            </a>

            <button
              type="button"
              onClick={() => setShowQr(prev => !prev)}
              className="py-2 px-3 bg-white dark:bg-[#0F1A33] border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] rounded-xl text-xs font-semibold text-[#18315E] dark:text-white flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-sky-600 dark:text-[#3156B5]" />
              <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </div>
        </div>

        {/* Static QR Code */}
        {showQr && (
          <div className="p-4 bg-white dark:bg-[#0F1A33] rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in zoom-in-95">
            <div className="p-3 bg-white rounded-lg shadow-sm border border-[#E5E1D8] inline-block">
              <QRCodeSVG value={resolvedUrl} size={150} level="M" />
            </div>
            <p className="text-[11px] text-[#60708B] dark:text-slate-300">
              Receiving staff can scan this with any phone's camera app to confirm receipt immediately.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}








