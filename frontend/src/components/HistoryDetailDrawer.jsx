import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, Building2, MapPin, FileText, Award, Package } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import DirectContactButtons from './ui/DirectContactButtons';
import DonationCertificateModal from './DonationCertificateModal';

const HistoryDetailDrawer = ({ isOpen, onClose, record, userRole }) => {
  const [certModalOpen, setCertModalOpen] = useState(false);
  if (!record) return null;

  const handleDownloadSinglePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('FoodBridge — Donation Record', 14, 22);

    doc.setFontSize(11);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 30);
    
    doc.setLineWidth(0.5);
    doc.line(14, 34, 196, 34);

    doc.setFontSize(12);
    doc.text(`Item: ${record.itemTitle}`, 14, 45);
    doc.text(`Category: ${record.category}`, 14, 52);
    doc.text(`Quantity: ${record.quantity} ${record.unit}`, 14, 59);
    doc.text(`Date: ${new Date(record.createdAt).toLocaleString()}`, 14, 66);
    
    doc.setFontSize(14);
    doc.text('Status', 14, 80);
    doc.setFontSize(12);
    doc.text(`Overall Status: ${record.overallStatus}`, 14, 88);
    doc.text(`NGO Status: ${record.ngoStatus}`, 14, 95);
    doc.text(`Donor Status: ${record.donorStatus}`, 14, 102);
    
    if (record.rejectionReason) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Rejection Reason: ${record.rejectionReason}`, 14, 109);
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(14);
    doc.text('Party Involved', 14, 125);
    doc.setFontSize(12);
    {['Pending', 'Requests Sent', 'Accepted', 'Completed', 'Declined', 'Awaiting NGO'].includes(record.overallStatus) ? (
      doc.text(`Name: N/A (Open Request)`, 14, 133)
    ) : (
      doc.text(`Name: ${record.otherPartyName}`, 14, 133)
    )};

    if (record.pickupDetails) {
      doc.setFontSize(14);
      doc.text('Pickup Details', 14, 150);
      doc.setFontSize(12);
      
      const splitLocation = doc.splitTextToSize(record.pickupDetails, 180);
      doc.text(splitLocation, 14, 158);
    }

    doc.save(`FoodBridge_Record_${record._id}.pdf`);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Record Details"
      icon={FileText}
      width="w-full max-w-md"
    >
      <div className="flex flex-col h-full space-y-6">
        
        {/* Header summary */}
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#60708B] tracking-wider block">
                {record.recordType}
              </span>
              <h3 className="font-bold text-[#18315E] dark:text-white text-lg leading-snug">{record.itemTitle}</h3>
            </div>
            <StatusBadge status={record.overallStatus} />
          </div>
          <div className="text-sm text-[#60708B] dark:text-slate-300">
            <strong>Quantity:</strong> {record.quantity} {record.unit}
          </div>
          <div className="text-xs text-[#60708B] mt-1">
            {new Date(record.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#60708B] dark:text-slate-300">
            Both Sides Status
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/20 border border-[#E5E1D8] dark:border-[#1E2D52]/30 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-[#18315E] dark:text-[#D9B65D] uppercase tracking-wider block mb-1">
                NGO
              </span>
              <span className="text-sm font-semibold text-[#18315E] dark:text-white">
                {record.ngoStatus}
              </span>
            </div>
            <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/20 border border-[#E5E1D8] dark:border-[#1E2D52]/30 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-[#18315E] dark:text-[#D9B65D] uppercase tracking-wider block mb-1">
                Donor
              </span>
              <span className="text-sm font-semibold text-[#18315E] dark:text-white">
                {record.donorStatus}
              </span>
            </div>
          </div>
          
          {record.rejectionReason && (
            <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/20 border border-[#E5E1D8] dark:border-[#1E2D52]/50 p-3 rounded-lg mt-2">
              <span className="text-xs font-bold text-[#18315E] dark:text-[#D9B65D] block mb-0.5">
                Rejection Reason:
              </span>
              <span className="text-sm text-[#18315E] dark:text-[#D9B65D]">
                {record.rejectionReason}
              </span>
            </div>
          )}
        </div>

        {/* Other Party */}
        <div className="space-y-3">
{['Pending', 'Requests Sent', 'Accepted', 'Completed', 'Declined', 'Awaiting NGO'].includes(record.overallStatus) ? (
          <div className="text-sm text-[#60708B] dark:text-slate-300">
            <span>N/A (Open Request)</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center">
              <Building2 className="w-4 h-4 text-[#60708B] mr-2 shrink-0" />
              <span className="font-semibold text-[#18315E] dark:text-white">
                {record.otherPartyName}
              </span>
            </div>
            {record.otherPartyCity && (
              <div className="text-xs text-[#60708B] dark:text-slate-300">
                {record.otherPartyCity}
              </div>
            )}
          </div>
        )}
</div>

        {/* Location Details */}
        {record.pickupDetails && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#60708B] dark:text-slate-300">
              Pickup / Delivery Details
            </h4>
            <div className="bg-[#F3F0EA] dark:bg-[#0F1A33] p-3 rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] flex items-start">
              <MapPin className="w-4 h-4 text-[#60708B] mr-2 mt-0.5" />
              <span className="text-sm text-[#18315E] dark:text-slate-300 whitespace-pre-wrap">{record.pickupDetails}</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 pb-2 space-y-2">
          {record.overallStatus === 'COMPLETED' && (
            <Button 
              variant="primary" 
              className="w-full justify-center bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white shadow-sm font-bold"
              icon={Award}
              onClick={() => setCertModalOpen(true)}
            >
              View Donation Certificate ??
            </Button>
          )}
          <Button 
            variant="secondary" 
            className="w-full justify-center border-[#E5E1D8]"
            icon={Download}
            onClick={handleDownloadSinglePDF}
          >
            Download PDF Record
          </Button>
        </div>
      </div>

      <DonationCertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        foodId={record.foodId || record.rawFood?._id}
      />
    </Drawer>
  );
};

export default HistoryDetailDrawer;








