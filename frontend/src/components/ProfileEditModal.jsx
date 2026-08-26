import React, { useState } from 'react';
import axios from 'axios';
import { X, User, Phone, MapPin, Building, FileText, CheckCircle, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfileEditModal = ({ user, token, onClose, onUserUpdated }) => {
  const isDonor = user?.accountType === 'DONOR';

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    orgName: user?.orgName || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    description: user?.description || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      if (onUserUpdated) {
        onUserUpdated(res.data);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
              User Profile Settings
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {isDonor ? 'Edit Donor Profile' : 'Edit Organisation Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg text-xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" /> Profile updated successfully!
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {isDonor ? 'Full Name' : 'Organisation Name'}
            </label>
            <input
              type="text"
              name={isDonor ? 'fullName' : 'orgName'}
              value={isDonor ? formData.fullName : formData.orgName}
              onChange={handleChange}
              placeholder={isDonor ? 'Your full name' : 'NGO / Organisation name'}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Business Name (for Donors) */}
          {isDonor && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-400" /> Business / Kitchen Name (Optional)
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Shrey's Home Kitchen or Fresh Bakes"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Contact phone number"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Personal Intent / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {isDonor ? 'Personal Intent & Kitchen Description' : 'Organisation Description'}
            </label>
            <p className="text-[11px] text-slate-400 mb-1">Share details about your food surplus goals or shop background.</p>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. We are a small home kitchen focused on reducing food waste and donating fresh meals to those in need..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
