import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Phone, MessageCircle, X, CheckCircle, Navigation } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivePickupsDrawer = ({ user, token, onClose }) => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState('');

  const fetchPickups = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/food/active-pickups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPickups(res.data);
    } catch (err) {
      console.error('Failed to fetch active pickups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [user, token]);

  const handleVerify = async (id) => {
    setError('');
    setVerifyingId(id);
    try {
      await axios.patch(`${API_URL}/api/food/verify-pickup/${id}`, { code: verifyCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerifyCode('');
      fetchPickups();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
          <Truck className="w-5 h-5 mr-2 text-green-600" /> Active Pickups
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading pickups...</div>
        ) : !Array.isArray(pickups) || pickups.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            No active pickups or handovers currently.
          </div>
        ) : (
          pickups.map(pickup => {
            const isDonor = user.accountType === 'DONOR';
            const counterpart = isDonor ? pickup.claimantId : pickup.donorId;
            const counterpartName = counterpart?.orgName || counterpart?.fullName || 'Unknown';
            const counterpartPhone = counterpart?.phone || '';

            return (
              <div key={pickup._id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1">{pickup.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                      In Progress
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{isDonor ? 'Claimed By:' : 'Donor:'}</span> {counterpartName}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-slate-800 dark:text-slate-200">Address:</span> {counterpart?.address}, {counterpart?.city}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex divide-x divide-slate-200 dark:divide-slate-600 border-b border-slate-200 dark:border-slate-600">
                  <a href={`tel:${counterpartPhone}`} className="flex-1 flex justify-center items-center py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors">
                    <Phone className="w-4 h-4 mr-2" /> Call
                  </a>
                  <a href={`https://wa.me/${counterpartPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium transition-colors">
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </a>
                </div>

                {/* Verification Flow */}
                <div className="p-4 bg-white dark:bg-slate-800">
                  {!isDonor ? (
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-1">Your Pickup Code</p>
                      <div className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-[0.25em]">{pickup.verificationCode}</div>
                      <p className="text-xs text-slate-500 mt-2">Present this code to the donor upon pickup to complete the handover.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-2">Verify Handover</p>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          maxLength="4"
                          placeholder="4-digit code"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-center font-mono tracking-widest text-slate-800 font-bold"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        />
                        <button 
                          onClick={() => handleVerify(pickup._id)}
                          disabled={verifyCode.length !== 4 || verifyingId === pickup._id}
                          className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                          {verifyingId === pickup._id ? '...' : <><CheckCircle className="w-4 h-4 mr-1" /> Verify</>}
                        </button>
                      </div>
                      {error && verifyingId === pickup._id && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivePickupsDrawer;
