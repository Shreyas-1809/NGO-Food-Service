import React, { useState } from 'react';
import { X, ShieldCheck, Upload, AlertCircle, CheckCircle2, FileText, Building2, Phone, Mail, Hash } from 'lucide-react';
import { submitProfileClaim } from '../services/ngoDirectoryService';
import Button from './ui/Button';

const ClaimProfileModal = ({ ngo, onClose, onSuccess }) => {
  const [orgName, setOrgName] = useState(ngo?.name || '');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState(ngo?.phone || '');
  const [regNumber, setRegNumber] = useState('');
  const [proofDocUrl, setProofDocUrl] = useState('');
  const [proofDocName, setProofDocName] = useState('');
  const [declaration, setDeclaration] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Proof document must be under 5MB.');
      return;
    }

    setProofDocName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofDocUrl(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!orgName.trim()) {
      setError('Official organisation name is required.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setError('Valid official email address is required.');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Official phone number is required.');
      return;
    }
    if (!declaration) {
      setError('Please certify that you are an authorised representative of this organisation.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await submitProfileClaim({
        externalOsmId: ngo.externalOsmId || ngo.id,
        externalName: ngo.name,
        externalSource: ngo.source || 'openstreetmap',
        externalAddress: ngo.address || ngo.area || '',
        city: ngo.city || '',
        coordinates: (ngo.lat !== null && ngo.lat !== undefined && ngo.lng !== null && ngo.lng !== undefined)
          ? [Number(ngo.lng), Number(ngo.lat)]
          : undefined,
        orgName: orgName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        regNumber: regNumber.trim(),
        proofDocUrl: proofDocUrl || null
      }, token);

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to submit claim:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit profile claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Claim Organisation Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official verification and FoodBridge onboarding
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  Claim Request Submitted!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you for claiming <span className="font-semibold text-slate-900 dark:text-white">{orgName}</span>. 
                  Our administration team will review your registration details and proof documents. Once approved, your organization 
                  will move to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Registered NGOs (Tier 1)</span> on FoodBridge.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="primary" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Context Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Public Listing Being Claimed
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{ngo?.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {ngo?.address || ngo?.area || 'Public Directory'} • Source: {ngo?.attribution || 'OpenStreetMap'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Organisation Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Official Organisation Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Mukul Madhav Foundation"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Official Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="contact@organisation.org"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Govt / Trust Registration Number (Optional)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    placeholder="e.g. 80G / 12A / NGO Darpan ID / Trust Deed No."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Proof Document Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Proof of Affiliation / Registration Document
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-colors">
                  <input
                    type="file"
                    id="proof-doc-upload"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="proof-doc-upload" className="cursor-pointer flex flex-col items-center space-y-1.5">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {proofDocName ? proofDocName : 'Upload certificate, letterhead, or identity proof'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PDF, PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="flex items-start space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="claim-declaration"
                  checked={declaration}
                  onChange={e => setDeclaration(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="claim-declaration" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer leading-tight">
                  I certify under penalty of account suspension that I am an authorised representative of this organisation 
                  and that the details submitted are true and verifiable.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? 'Submitting...' : 'Submit Claim for Review'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimProfileModal;
