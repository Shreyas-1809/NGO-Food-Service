import React from 'react';
import { jsPDF } from 'jspdf';
import { Package, Download, User as UserIcon, Building2, MapPin, X, FileText } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';

const HistoryDetailDrawer = ({ isOpen, onClose, record, userRole }) => {
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
    doc.text(`Name: ${record.otherPartyName}`, 14, 133);

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
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                {record.recordType}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{record.itemTitle}</h3>
            </div>
            <StatusBadge status={record.overallStatus} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <strong>Quantity:</strong> {record.quantity} {record.unit}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(record.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Both Sides Status
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                NGO
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {record.ngoStatus}
              </span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Donor
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {record.donorStatus}
              </span>
            </div>
          </div>
          
          {record.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg mt-2">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 block mb-0.5">
                Rejection Reason:
              </span>
              <span className="text-sm text-red-800 dark:text-red-300">
                {record.rejectionReason}
              </span>
            </div>
          )}
        </div>

        {/* Other Party */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Other Party Involved
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
            <Building2 className="w-5 h-5 text-slate-400 mr-2" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{record.otherPartyName}</span>
          </div>
        </div>

        {/* Location Details */}
        {record.pickupDetails && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pickup / Delivery Details
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start">
              <MapPin className="w-4 h-4 text-slate-400 mr-2 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.pickupDetails}</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 pb-2">
          <Button 
            variant="secondary" 
            className="w-full justify-center border-slate-300"
            icon={Download}
            onClick={handleDownloadSinglePDF}
          >
            Download PDF Record
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default HistoryDetailDrawer;
