import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Package, Trash2, Clock, Sparkles } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { T } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Terminal need statuses — soft-delete allowed
const TERMINAL_NEED_STATUSES = new Set(['FULFILLED', 'CANCELLED', 'ARCHIVED']);

const MyShortagesDrawer = ({ isOpen, token, onClose, onNeedUpdated }) => {
  const [needs, setNeeds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ACTIVE, FULFILLED, CANCELLED
  const [viewTab, setViewTab] = useState('NEEDS'); // NEEDS, TEMPLATES
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyNeeds = useCallback(async () => {
    try {
      setLoading(true);
      const resNeeds = await axios.get(`${API_URL}/api/needs/my-needs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resTemplates = await axios.get(`${API_URL}/api/recurring-needs/my-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNeeds(resNeeds.data);
      setTemplates(resTemplates.data);
    } catch (err) {
      console.error('Error fetching my needs/templates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isOpen) fetchMyNeeds();
  }, [token, isOpen, fetchMyNeeds]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/needs/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  // Hard delete: only for ACTIVE needs (original behavior, unclaimed)
  const handleHardDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortage request?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/needs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error('Failed to delete shortage request:', err);
      alert(err.response?.data?.message || 'Failed to delete shortage request');
    } finally {
      setDeletingId(null);
    }
  };

  // Soft delete: for terminal-state needs — hides from dashboard, keeps in history
  const handleSoftDelete = async (id) => {
    if (!window.confirm(
      'Delete this posting?\nIt will stay in your history and certificates.'
    )) return;
    setDeletingId(id);
    try {
      await axios.patch(`${API_URL}/api/needs/${id}/owner-delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNeeds(prev => prev.filter(n => n._id !== id));
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove from dashboard');
    } finally {
      setDeletingId(null);
    }
  };

  // Clear all finished needs at once
  const handleClearAllFinished = async () => {
    const finished = needs.filter(n => TERMINAL_NEED_STATUSES.has(n.status));
    if (finished.length === 0) return;
    if (!window.confirm(
      `Remove all ${finished.length} finished need(s) from your dashboard?\nThey will stay in your history.`
    )) return;
    try {
      await Promise.all(
        finished.map(n =>
          axios.patch(`${API_URL}/api/needs/${n._id}/owner-delete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {})
        )
      );
      setNeeds(prev => prev.filter(n => !TERMINAL_NEED_STATUSES.has(n.status)));
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTemplateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/recurring-needs/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
    } catch (err) {
      console.error('Failed to update template status:', err);
      alert('Failed to update template status');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring template? Future occurrences will stop generating.')) return;
    try {
      await axios.delete(`${API_URL}/api/recurring-needs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('Failed to delete template');
    }
  };

  const filteredNeeds = needs.filter(need => {
    if (filterTab === 'ALL') return true;
    return need.status === filterTab;
  });

  const finishedNeeds = needs.filter(n => TERMINAL_NEED_STATUSES.has(n.status));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={<T text="My Shortages & Needs" />}
      icon={Package}
      width="w-full max-w-md"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Main View Tabs */}
        <div className="flex space-x-1 bg-[#F3F0EA] dark:bg-[#0F1A33] p-1 rounded-xl">
          <button
            onClick={() => setViewTab('NEEDS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              viewTab === 'NEEDS'
                ? 'bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white shadow-xs'
                : 'text-[#60708B] hover:text-[#18315E] dark:hover:text-[#9AA3B8]'
            }`}
          >
            <T text="One-Time Needs" />
          </button>
          <button
            onClick={() => setViewTab('TEMPLATES')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              viewTab === 'TEMPLATES'
                ? 'bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white shadow-xs'
                : 'text-[#60708B] hover:text-[#18315E] dark:hover:text-[#9AA3B8]'
            }`}
          >
            <T text="Recurring Templates" />
          </button>
        </div>

        {viewTab === 'NEEDS' ? (
          <>
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52]">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'ACTIVE', label: 'Active' },
                { key: 'FULFILLED', label: 'Fulfilled' },
                { key: 'CANCELLED', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterTab === tab.key
                      ? 'bg-[#173B78] text-white shadow-xs'
                      : 'text-[#60708B] dark:text-slate-300 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]'
                  }`}
                >
                  <T text={tab.label} />
                </button>
              ))}
            </div>

            {/* "Clear all finished" action — only visible when filtered to ALL or a terminal tab */}
            {finishedNeeds.length > 0 && (filterTab === 'ALL' || TERMINAL_NEED_STATUSES.has(filterTab)) && (
              <div className="flex justify-end -mt-1">
                <button
                  onClick={handleClearAllFinished}
                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-[#E5707A] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Clear all finished
                </button>
              </div>
            )}

            {/* Needs List */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-8 text-[#60708B] text-xs">Loading shortages...</div>
              ) : filteredNeeds.length === 0 ? (
                <EmptyState
                  icon={Package}
                  message="No shortages found"
                  className="py-10"
                />
              ) : (
              filteredNeeds.map(need => {
                const isTerminal = TERMINAL_NEED_STATUSES.has(need.status);
                const isDeleting = deletingId === need._id;
                return (
                <div key={need._id} className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#E5B85C] dark:text-[#D9B65D] tracking-wider block">
                        {need.category || 'Food'} Deficit
                      </span>
                      <h4 className="font-bold text-[#18315E] dark:text-white text-sm leading-snug">{need.title}</h4>
                    </div>
                    <StatusBadge status={need.status} />
                  </div>

                  <div className="text-xs text-[#60708B] dark:text-slate-300 space-y-1">
                    <p><strong>Quantity Needed:</strong> {need.quantity} {need.unit || 'servings'}</p>
                    {need.description && <p className="italic text-[11px] text-[#60708B] dark:text-slate-300">"{need.description}"</p>}
                    <div className="flex items-center text-[10px] text-[#60708B] pt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Posted {new Date(need.createdAt).toLocaleDateString([], { dateStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex gap-2">
                    {need.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateStatus(need._id, 'FULFILLED')}
                        >
                          Mark Fulfilled
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateStatus(need._id, 'CANCELLED')}
                        >
                          Cancel Need
                        </Button>
                        {/* Hard delete allowed only on active/unclaimed needs */}
                        <button
                          onClick={() => handleHardDelete(need._id)}
                          disabled={isDeleting}
                          title="Delete this need"
                          className="flex items-center gap-1 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#1E2D52] hover:border-red-300 dark:hover:border-[#E5707A]/50 hover:text-red-500 dark:hover:text-[#E5707A] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {need.status !== 'ACTIVE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 bg-[#E5B85C] hover:bg-[#E5B85C] text-white"
                        onClick={() => handleUpdateStatus(need._id, 'ACTIVE')}
                      >
                        Reopen Need
                      </Button>
                    )}
                    {/* Soft delete for terminal states */}
                    {isTerminal && (
                      <button
                        onClick={() => handleSoftDelete(need._id)}
                        disabled={isDeleting}
                        title="Remove from dashboard (stays in history)"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#1E2D52] hover:border-red-300 dark:hover:border-[#E5707A]/50 hover:text-red-500 dark:hover:text-[#E5707A] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
                );
              })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-8 text-[#60708B] text-xs">Loading templates...</div>
            ) : templates.length === 0 ? (
              <EmptyState
                icon={Package}
                message="No recurring templates found"
                className="py-10"
              />
            ) : (
            templates.map(template => (
              <div key={template._id} className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#18315E] dark:text-[#D9B65D] tracking-wider block">
                      {template.frequency} • {template.category || 'Food'}
                    </span>
                    <h4 className="font-bold text-[#18315E] dark:text-white text-sm leading-snug">{template.title}</h4>
                  </div>
                  <StatusBadge status={template.status} />
                </div>

                <div className="text-xs text-[#60708B] dark:text-slate-300 space-y-1">
                  <p><strong>Quantity:</strong> {template.quantity} {template.unit || 'servings'}</p>
                  <p><strong>Next Occurrence:</strong> {new Date(template.nextOccurrence).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  <div className="flex items-center text-[10px] text-[#60708B] pt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Created {new Date(template.createdAt).toLocaleDateString([], { dateStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex gap-2">
                  {template.status === 'ACTIVE' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpdateTemplateStatus(template._id, 'PAUSED')}
                    >
                      Pause
                    </Button>
                  )}
                  {template.status === 'PAUSED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-[#173B78] hover:bg-[#173B78] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white"
                      onClick={() => handleUpdateTemplateStatus(template._id, 'ACTIVE')}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUpdateTemplateStatus(template._id, 'CANCELLED')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template._id)}
                    title="Delete template"
                    icon={Trash2}
                  />
                </div>
              </div>
            ))
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default MyShortagesDrawer;
