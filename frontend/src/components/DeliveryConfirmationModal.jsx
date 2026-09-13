import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, QrCode, MessageCircle, ExternalLink, ShieldCheck, Truck, Building } from 'lucide-react';
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
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-800 dark:text-sky-200 text-xs flex items-center gap-2.5">
          <Truck className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <p className="font-bold">Food is Out for Delivery / En Route</p>
            <p className="text-[11px] text-sky-700 dark:text-sky-300/80">
              When <strong>{volunteerName}</strong> arrives at your NGO facility, use this link to confirm handover.
            </p>
          </div>
        </div>

        {/* Link Box */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              NGO Delivery Verification Link
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Single-Use Link</span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
            <span className="truncate flex-1 text-[11px]">{resolvedUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-sans font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
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
              className="flex-1 min-w-[140px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
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
              className="py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </div>
        </div>

        {/* Static QR Code */}
        {showQr && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in zoom-in-95">
            <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 inline-block">
              <QRCodeSVG value={resolvedUrl} size={150} level="M" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Receiving staff can scan this with any phone's camera app to confirm receipt immediately.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
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
