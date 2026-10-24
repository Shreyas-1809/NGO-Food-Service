import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Package, Trash2, Clock } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { T } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyShortagesDrawer = ({ isOpen, token, onClose, onNeedUpdated }) => {
  const [needs, setNeeds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ACTIVE, FULFILLED, CANCELLED
  const [viewTab, setViewTab] = useState('NEEDS'); // NEEDS, TEMPLATES

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
  }, [
	token,
	isOpen,
	fetchMyNeeds
]);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortage request?')) return;
    try {
      await axios.delete(`${API_URL}/api/needs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error('Failed to delete shortage request:', err);
      alert('Failed to delete shortage request');
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
              filteredNeeds.map(need => (
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
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(need._id)}
                  title="Delete shortage"
                  icon={Trash2}
                />
              </div>
            </div>
          ))
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








