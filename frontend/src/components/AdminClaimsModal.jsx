import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, AlertCircle, FileText, ExternalLink, Clock, Building2, Phone, Mail, Hash } from 'lucide-react';
import { fetchProfileClaims, reviewProfileClaim } from '../services/ngoDirectoryService';
import Button from './ui/Button';

const AdminClaimsModal = ({ onClose, onClaimApproved }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('token');

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfileClaims('pending', token);
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load profile claims:', err);
      setError('Failed to load claim requests. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleReview = async (claimId, status) => {
    setActionLoading(claimId);
    setError(null);
    setSuccessMessage('');
    try {
      await reviewProfileClaim(claimId, { status }, token);
      setSuccessMessage(status === 'approved' 
        ? 'Claim approved! Organisation is now verified and added to Tier 1 (Registered NGOs).'
        : 'Claim rejected.');
      await loadClaims();
      if (onClaimApproved && status === 'approved') {
        onClaimApproved();
      }
    } catch (err) {
      console.error('Failed to review claim:', err);
      setError(err.response?.data?.message || err.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
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
                Review Profile Claims (Admin)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify external organisation claims and onboard them to Tier 1
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
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-xs">Loading pending claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No pending profile claims</p>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                When a user claims an unverified organisation from the Discover NGOs tab, the request will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map(claim => (
                <div 
                  key={claim._id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                        Claim Request
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {claim.orgName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Claiming public listing: <strong className="text-slate-700 dark:text-slate-300">{claim.externalName}</strong> ({claim.externalSource || 'OpenStreetMap'})
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 self-start sm:self-auto">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${claim.contactEmail}`} className="hover:underline truncate">{claim.contactEmail}</a>
                    </div>
                    {claim.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${claim.contactPhone}`} className="hover:underline">{claim.contactPhone}</a>
                      </div>
                    )}
                    {claim.regNumber && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Reg No: <strong>{claim.regNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  {claim.proofDocUrl && (
                    <div className="pt-1">
                      <a 
                        href={claim.proofDocUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Uploaded Verification Document ↗</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => handleReview(claim._id, 'rejected')}
                      disabled={actionLoading === claim._id}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(claim._id, 'approved')}
                      disabled={actionLoading === claim._id}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{actionLoading === claim._id ? 'Approving...' : 'Approve & Verify'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClaimsModal;
