import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Phone, MessageCircle, Mail, X, CheckCircle, Navigation, QrCode, ShieldCheck } from 'lucide-react';
import DirectContactButtons from './ui/DirectContactButtons';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivePickupsDrawer = ({ user, token, onClose }) => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState('');
  const [editingVolunteer, setEditingVolunteer] = useState({});
  const [volunteerForm, setVolunteerForm] = useState({});
  const [receiptForm, setReceiptForm] = useState({});
  const [deliveryModalFood, setDeliveryModalFood] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

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
            const counterpartEmail = counterpart?.email || '';
            const vol = pickup.volunteerAssignment || {};
            const isEditingVol = editingVolunteer[pickup._id];
            const volForm = volunteerForm[pickup._id] || { name: vol.name || '', phone: vol.phone || '', notes: vol.notes || '' };

            const handleAssignVol = async (id) => {
              try {
                await axios.patch(`${API_URL}/api/food/${id}/assign-volunteer`, volForm, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setEditingVolunteer(prev => ({ ...prev, [id]: false }));
                fetchPickups();
              } catch (err) {
                alert('Failed to assign volunteer');
              }
            };

            const rcptForm = receiptForm[pickup._id] || { condition: pickup.receiptCondition || 'Good', note: pickup.receiptNote || '' };
            const handleReceiptCondition = async (id) => {
              try {
                await axios.patch(`${API_URL}/api/food/${id}/receipt-condition`, { condition: rcptForm.condition, note: rcptForm.note }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                fetchPickups();
                alert('Receipt condition updated!');
              } catch (err) {
                alert('Failed to update receipt condition');
              }
            };

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
                    <span className="font-medium text-slate-800 dark:text-slate-200">{isDonor ? 'NGO Address:' : 'Pickup Address:'}</span> {(!isDonor && pickup.pickupAddress) ? pickup.pickupAddress : [counterpart?.address, counterpart?.city].filter(Boolean).join(', ') || 'Not provided'}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Contact {isDonor ? 'NGO' : 'Donor'}:
                  </span>
                  <DirectContactButtons
                    phone={counterpartPhone}
                    email={counterpartEmail}
                    name={counterpartName}
                    waMessage={`Hello ${counterpartName}, I am coordinating pickup of "${pickup.title}".`}
                    emailSubject={`FoodBridge Coordination: ${pickup.title}`}
                    size="xs"
                  />
                </div>

                {/* Volunteer Assignment Section (For NGO) */}
                {!isDonor && (
                  <div className="p-4 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Pickup Assignment</h5>
                      {(!isEditingVol && vol.name) && (
                        <button onClick={() => setEditingVolunteer(prev => ({ ...prev, [pickup._id]: true }))} className="text-blue-600 text-xs font-bold hover:underline">
                          Edit
                        </button>
                      )}
                    </div>
                    {(!vol.name || isEditingVol) ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Volunteer Name"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          value={volForm.name}
                          onChange={e => setVolunteerForm(prev => ({ ...prev, [pickup._id]: { ...volForm, name: e.target.value } }))}
                        />
                        <input
                          type="text"
                          placeholder="Volunteer Phone"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          value={volForm.phone}
                          onChange={e => setVolunteerForm(prev => ({ ...prev, [pickup._id]: { ...volForm, phone: e.target.value } }))}
                        />
                        <input
                          type="text"
                          placeholder="Instructions / Arrival Time (e.g. ETA 30 mins)"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          value={volForm.notes}
                          onChange={e => setVolunteerForm(prev => ({ ...prev, [pickup._id]: { ...volForm, notes: e.target.value } }))}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAssignVol(pickup._id)} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                            Save Assignment
                          </button>
                          {isEditingVol && (
                             <button onClick={() => setEditingVolunteer(prev => ({ ...prev, [pickup._id]: false }))} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300">
                               Cancel
                             </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <div>
                          <p><strong className="text-slate-900 dark:text-white">Volunteer:</strong> {vol.name}</p>
                          <p><strong className="text-slate-900 dark:text-white">Phone:</strong> {vol.phone || 'Not provided'}</p>
                          {vol.notes && <p className="mt-1 italic">"{vol.notes}"</p>}
                        </div>
                        {vol.phone && (
                          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Volunteer</span>
                            <DirectContactButtons
                              phone={vol.phone}
                              name={vol.name}
                              waMessage={`Hello ${vol.name}, coordinating pickup for "${pickup.title}".`}
                              size="xs"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* En route status and delivery confirmation link for NGO */}
                {!isDonor && (pickup.status === 'IN_TRANSIT' || pickup.status === 'picked_up' || pickup.confirmationTokens?.deliveryToken) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      {pickup.status === 'COMPLETED' ? 'Delivered' : 'Delivery Link & QR Ready'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryModalFood(pickup);
                        setDeliveryModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Confirm Delivery & QR</span>
                    </button>
                  </div>
                )}
                
                {/* Volunteer Info (For Donor) */}
                {isDonor && (
                  <div className="p-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">NGO Volunteer Assignment</h5>
                    {vol.name ? (
                      <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <div>
                          <p><strong className="text-slate-900 dark:text-white">Volunteer:</strong> {vol.name}</p>
                          <p><strong className="text-slate-900 dark:text-white">Phone:</strong> {vol.phone || 'Not provided'}</p>
                          {vol.notes && <p className="mt-1 italic">"{vol.notes}"</p>}
                        </div>
                        {vol.phone && (
                          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Assigned Volunteer</span>
                            <DirectContactButtons
                              phone={vol.phone}
                              name={vol.name}
                              waMessage={`Hello ${vol.name}, coordinating pickup for "${pickup.title}".`}
                              size="xs"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic text-center">
                        Volunteer not yet assigned
                      </div>
                    )}
                  </div>
                )}

                {/* Receipt Condition Section (For NGO) */}
                {!isDonor && pickup.status === 'COMPLETED' && (
                   <div className="p-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30">
                     <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Report Receipt Condition</h5>
                     <div className="flex gap-2 mb-2">
                       <select
                         className="flex-1 px-2 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                         value={rcptForm.condition}
                         onChange={e => setReceiptForm(prev => ({ ...prev, [pickup._id]: { ...rcptForm, condition: e.target.value } }))}
                       >
                         <option value="Good">Good</option>
                         <option value="Acceptable">Acceptable</option>
                         <option value="Issue Reported">Poor (Spoiled/Issues)</option>
                       </select>
                     </div>
                     <input
                       type="text"
                       placeholder="Add a note (optional)..."
                       className="w-full px-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-2"
                       value={rcptForm.note}
                       onChange={e => setReceiptForm(prev => ({ ...prev, [pickup._id]: { ...rcptForm, note: e.target.value } }))}
                     />
                     <button onClick={() => handleReceiptCondition(pickup._id)} className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                       Submit Report
                     </button>
                   </div>
                )}

                {/* Verification Flow */}
                {pickup.status !== 'COMPLETED' && (
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      <DeliveryConfirmationModal
        isOpen={deliveryModalOpen}
        onClose={() => {
          setDeliveryModalOpen(false);
          setDeliveryModalFood(null);
        }}
        food={deliveryModalFood}
      />
    </div>
  );
};

export default ActivePickupsDrawer;
