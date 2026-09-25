import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Phone, 
  MessageCircle, 
  Mail, 
  X, 
  CheckCircle, 
  Navigation, 
  QrCode, 
  ShieldCheck,
  MapPin,
  Clock,
  UserCheck,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight,
  ExternalLink,
  User
} from 'lucide-react';
import DirectContactButtons from './ui/DirectContactButtons';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';
import Drawer from './ui/Drawer';
import { T } from '../context/LanguageContext';
import { formatPickupTime } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivePickupsDrawer = ({ isOpen, user, token, socket, onClose, highlightTaskId }) => {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState('');
  const [editingVolunteer, setEditingVolunteer] = useState({});
  const [volunteerForm, setVolunteerForm] = useState({});
  const [savingVolunteer, setSavingVolunteer] = useState({});
  const [assignError, setAssignError] = useState({});
  const [receiptForm, setReceiptForm] = useState({});
  const [deliveryModalFood, setDeliveryModalFood] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL', 'IN_TRANSIT', 'AWAITING_VOLUNTEER', 'COMPLETED'
  const [expandedTasks, setExpandedTasks] = useState({});

  const isDonor = user?.accountType === 'DONOR';

  const fetchPickups = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/api/food/active-pickups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = res.data || [];
      setPickups(list);

      // Auto-expand task if highlightTaskId passed
      if (highlightTaskId) {
        setExpandedTasks(prev => ({ ...prev, [highlightTaskId]: true }));
      } else if (list.length > 0) {
        // Expand first task by default if none expanded yet
        setExpandedTasks(prev => (Object.keys(prev).length === 0 ? { [list[0]._id]: true } : prev));
      }
    } catch (err) {
      console.error('Failed to fetch active pickups', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Live polling and socket listeners while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    fetchPickups();

    // 1. Instant real-time updates via Socket.IO
    const handleLiveUpdate = () => {
      fetchPickups(true);
    };

    if (socket && typeof socket.on === 'function') {
      socket.on('LISTING_UPDATED', handleLiveUpdate);
      socket.on('TASK_UPDATED', handleLiveUpdate);
      socket.on('PICKUP_CONFIRMED', handleLiveUpdate);
      socket.on('NGO_CONFIRMED', handleLiveUpdate);
      socket.on('CLAIM_ACCEPTED', handleLiveUpdate);
    }

    // 2. Continuous 15-second background polling while drawer is open
    const interval = setInterval(() => {
      fetchPickups(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      if (socket && typeof socket.off === 'function') {
        socket.off('LISTING_UPDATED', handleLiveUpdate);
        socket.off('TASK_UPDATED', handleLiveUpdate);
        socket.off('PICKUP_CONFIRMED', handleLiveUpdate);
        socket.off('NGO_CONFIRMED', handleLiveUpdate);
        socket.off('CLAIM_ACCEPTED', handleLiveUpdate);
      }
    };
  }, [isOpen, user, token, socket]);

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCopyLink = (url, typeKey) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedToken(typeKey);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleVerifyCode = async (id) => {
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

  const handleFormChange = (pickupId, field, value) => {
    setVolunteerForm(prev => ({
      ...prev,
      [pickupId]: {
        ...(prev[pickupId] || {}),
        [field]: value
      }
    }));
  };

  const startEditingVolunteer = (pickup) => {
    const currentVol = pickup.volunteerAssignment || (pickup.volunteerAssignments?.[0] || {});
    setVolunteerForm(prev => ({
      ...prev,
      [pickup._id]: {
        name: currentVol.name || '',
        phone: currentVol.phone || '',
        vehicleNumber: currentVol.arrivalTime || currentVol.vehicleNumber || ''
      }
    }));
    setEditingVolunteer(prev => ({ ...prev, [pickup._id]: true }));
    setAssignError(prev => ({ ...prev, [pickup._id]: null }));
  };

  const handleSaveVolunteer = async (pickupId) => {
    const form = volunteerForm[pickupId] || {};
    const name = (form.name || '').trim();
    const phone = (form.phone || '').trim();
    const vehicleNumber = (form.vehicleNumber || '').trim();

    if (!name) {
      setAssignError(prev => ({ ...prev, [pickupId]: 'Please enter volunteer name' }));
      return;
    }
    if (!phone) {
      setAssignError(prev => ({ ...prev, [pickupId]: 'Please enter volunteer phone number' }));
      return;
    }

    setSavingVolunteer(prev => ({ ...prev, [pickupId]: true }));
    setAssignError(prev => ({ ...prev, [pickupId]: null }));

    try {
      await axios.patch(
        `${API_URL}/api/food/${pickupId}/assign-volunteer`,
        {
          volunteers: [{ name, phone, vehicleNumber }],
          name,
          phone,
          vehicleNumber
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingVolunteer(prev => ({ ...prev, [pickupId]: false }));
      await fetchPickups();
    } catch (err) {
      console.error('Failed to assign volunteer:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save volunteer assignment';
      setAssignError(prev => ({ ...prev, [pickupId]: errMsg }));
    } finally {
      setSavingVolunteer(prev => ({ ...prev, [pickupId]: false }));
    }
  };

  // Auto-archive: Exclude completed and delivered tasks from the active workspace
  const activePickups = pickups.filter(p => p.status !== 'COMPLETED' && p.volunteerStatus !== 'delivered');

  const filteredPickups = activePickups.filter(p => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'IN_TRANSIT') return p.status === 'IN_TRANSIT' || p.volunteerStatus === 'picked_up';
    if (filterTab === 'AWAITING_VOLUNTEER') return (!p.volunteerAssignment?.name && !p.volunteerAssignments?.length) || p.volunteerStatus === 'declined';
    return true;
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={<T text="Active Pickups Workspace" />}
      subtitle={<T text="Task Stepper, Volunteer Assignment & Handover Links" />}
      icon={Truck}
      width="w-full max-w-2xl"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Filter Tabs Header */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Active Tasks', count: activePickups.length },
            { id: 'IN_TRANSIT', label: 'In Transit', count: activePickups.filter(p => p.status === 'IN_TRANSIT' || p.volunteerStatus === 'picked_up').length },
            { id: 'AWAITING_VOLUNTEER', label: 'Awaiting Volunteer', count: activePickups.filter(p => (!p.volunteerAssignment?.name && !p.volunteerAssignments?.length) || p.volunteerStatus === 'declined').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Task List Workspace */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading workspace tasks...</span>
            </div>
          ) : filteredPickups.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">No Active Tasks in this View</h4>
              <p className="text-xs text-slate-400">Accepted claim requests and active pickup handovers will appear here.</p>
            </div>
          ) : (
            filteredPickups.map(pickup => {
              const counterpart = isDonor ? pickup.claimantId : pickup.donorId;
              const counterpartName = counterpart?.orgName || counterpart?.fullName || 'Partner';
              const counterpartPhone = counterpart?.phone || '';
              const counterpartEmail = counterpart?.email || '';
              const vol = pickup.volunteerAssignment || (pickup.volunteerAssignments?.[0] || {});
              const isExpanded = Boolean(expandedTasks[pickup._id]);

              const pickupToken = pickup.confirmationTokens?.pickupToken;
              const deliveryToken = pickup.confirmationTokens?.deliveryToken;
              const volunteerToken = pickup.confirmationTokens?.volunteerToken;
              const frontendUrl = window.location.origin;

              const pickupUrl = pickupToken ? `${frontendUrl}/confirm-pickup/${pickup._id}?token=${pickupToken}` : '';
              const deliveryUrl = deliveryToken ? `${frontendUrl}/confirm-delivery/${pickup._id}?token=${deliveryToken}` : '';
              const volunteerUrl = volunteerToken ? `${frontendUrl}/pickup/${pickup._id}?token=${volunteerToken}` : '';

              // Stepper Status logic
              const isAccepted = pickup.status === 'ACCEPTED' || pickup.status === 'CLAIMED' || pickup.status === 'IN_TRANSIT' || pickup.status === 'COMPLETED';
              const isVolAssigned = Boolean(vol.name) && pickup.volunteerStatus !== 'declined';
              const isInTransit = pickup.status === 'IN_TRANSIT' || pickup.status === 'picked_up' || pickup.status === 'COMPLETED';
              const isCompleted = pickup.status === 'COMPLETED';

              const isFormVisible = !isDonor && (!isVolAssigned || Boolean(editingVolunteer[pickup._id]));
              const currentVolForm = volunteerForm[pickup._id] || { 
                name: vol.name || '', 
                phone: vol.phone || '', 
                vehicleNumber: vol.arrivalTime || vol.vehicleNumber || vol.notes || '' 
              };

              return (
                <div 
                  key={pickup._id} 
                  className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all overflow-hidden shadow-xs ${
                    highlightTaskId === pickup._id 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Card Main Header Bar */}
                  <div 
                    onClick={() => toggleExpand(pickup._id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                          {pickup.title}
                        </h4>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          ({pickup.quantity || 0} Servings)
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                        <span><strong>{isDonor ? 'Recipient NGO:' : 'Donor:'}</strong> {counterpartName}</span>
                        <span>•</span>
                        <span><strong>Requested:</strong> {formatPickupTime(pickup.requestedPickupTime || pickup.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status Pill Badge */}
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        isInTransit ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                        pickup.volunteerStatus === 'declined' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                        isVolAssigned ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {isCompleted ? 'Completed ✓' :
                         isInTransit ? 'En Route 🚚' :
                         pickup.volunteerStatus === 'declined' ? 'Volunteer Declined ⚠️' :
                         isVolAssigned ? 'Volunteer Assigned' :
                         'Awaiting Volunteer'}
                      </span>

                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Task Stepper Visual Bar */}
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-t border-b border-slate-100 dark:border-slate-700/60">
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                      <div className={`py-1 rounded-lg ${isAccepted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        1. Accepted ✓
                      </div>
                      <div className={`py-1 rounded-lg ${isVolAssigned ? 'bg-emerald-500 text-white' : pickup.volunteerStatus === 'declined' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        2. Vol Assigned
                      </div>
                      <div className={`py-1 rounded-lg ${isInTransit ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        3. In Transit 🚚
                      </div>
                      <div className={`py-1 rounded-lg ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        4. Delivered ✓
                      </div>
                    </div>
                  </div>

                  {/* Expanded Task Workspace Details */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 text-xs animate-in fade-in duration-200">
                      {/* Counterpart Contact Section */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                            {isDonor ? 'Recipient Organisation' : 'Food Donor Partner'}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{counterpartName}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center mt-1">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            <span>{(!isDonor && pickup.pickupAddress) ? pickup.pickupAddress : [counterpart?.address, counterpart?.city].filter(Boolean).join(', ') || 'Pune Hub'}</span>
                          </p>
                        </div>
                        <DirectContactButtons
                          phone={counterpartPhone}
                          email={counterpartEmail}
                          name={counterpartName}
                          waMessage={`Hello ${counterpartName}, coordinating task pickup for "${pickup.title}".`}
                          emailSubject={`FoodBridge Coordination: ${pickup.title}`}
                          size="sm"
                        />
                      </div>

                      {/* Volunteer Assignment Section */}
                      {isFormVisible ? (
                        /* NGO Inline Assignment Form */
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/60 shadow-xs space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                              <span>{vol.name ? 'Edit Volunteer Assignment' : 'Assign Pickup Volunteer'}</span>
                            </span>
                            {isVolAssigned && (
                              <button
                                type="button"
                                onClick={() => setEditingVolunteer(prev => ({ ...prev, [pickup._id]: false }))}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enter the details of the volunteer who will pick up and transport this surplus food.
                          </p>

                          {assignError[pickup._id] && (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                              {assignError[pickup._id]}
                            </div>
                          )}

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Volunteer Name *
                              </label>
                              <div className="relative">
                                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Priya Sharma"
                                  value={currentVolForm.name || ''}
                                  onChange={(e) => handleFormChange(pickup._id, 'name', e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Phone Number *
                                </label>
                                <div className="relative">
                                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. +91 9823012345"
                                    value={currentVolForm.phone || ''}
                                    onChange={(e) => handleFormChange(pickup._id, 'phone', e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Vehicle Number / Info
                                </label>
                                <div className="relative">
                                  <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="e.g. MH 12 AB 1234"
                                    value={currentVolForm.vehicleNumber || ''}
                                    onChange={(e) => handleFormChange(pickup._id, 'vehicleNumber', e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={savingVolunteer[pickup._id]}
                              onClick={() => handleSaveVolunteer(pickup._id)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>{savingVolunteer[pickup._id] ? 'Saving Volunteer...' : 'Save Volunteer Assignment'}</span>
                            </button>
                          </div>
                        </div>
                      ) : isVolAssigned ? (
                        /* Assigned Volunteer Display Card */
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                              <span>Pickup Volunteer Assignment</span>
                            </span>
                            {!isDonor && (
                              <button
                                type="button"
                                onClick={() => startEditingVolunteer(pickup)}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                              >
                                Edit / Reassign
                              </button>
                            )}
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{vol.name}</p>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    pickup.volunteerStatus === 'declined' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                                    isCompleted || pickup.volunteerStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                    isInTransit || pickup.volunteerStatus === 'picked_up' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                                    ['en_route', 'accepted'].includes(pickup.volunteerStatus) ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  }`}>
                                    {pickup.volunteerStatus === 'declined' ? 'Declined ⚠️' :
                                     isCompleted || pickup.volunteerStatus === 'delivered' ? 'Delivered ✓' :
                                     isInTransit || pickup.volunteerStatus === 'picked_up' ? 'In Transit 🚚' :
                                     ['en_route', 'accepted'].includes(pickup.volunteerStatus) ? 'En Route 🚚' :
                                     'Assigned'}
                                  </span>
                                </div>
                                {vol.phone && <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{vol.phone}</p>}
                                {(vol.arrivalTime || vol.vehicleNumber || vol.notes) && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Vehicle / Notes: <strong>{vol.arrivalTime || vol.vehicleNumber || vol.notes}</strong>
                                  </p>
                                )}
                              </div>
                              <DirectContactButtons
                                phone={vol.phone}
                                name={vol.name}
                                waMessage={`Hello ${vol.name}, coordinating pickup for "${pickup.title}".`}
                                size="xs"
                              />
                            </div>

                            {/* Single Action: Send to Volunteer via WhatsApp */}
                            {volunteerUrl && !isDonor && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                                <a
                                  href={`https://wa.me/${(vol.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${vol.name || 'Volunteer'}, here is your food pickup task & navigation link for "${pickup.title}":\n\n${volunteerUrl}\n\nPlease tap this link to view pickup location, drop-off location, item details, and update your status.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                                  title="Open WhatsApp with prefilled volunteer task link"
                                >
                                  <Share2 className="w-4 h-4" />
                                  <span>Send to Volunteer via WhatsApp</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {pickup.volunteerStatus === 'declined' && (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{pickup.volunteerDeclineReason ? `Declined: ${pickup.volunteerDeclineReason}` : 'Volunteer declined this task.'}</span>
                              </div>
                              {!isDonor && (
                                <button
                                  type="button"
                                  onClick={() => startEditingVolunteer(pickup)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Reassign Volunteer
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Donor Read-Only Empty State */
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <span>Pickup Volunteer Assignment</span>
                          </span>
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 italic text-xs">
                            Volunteer not yet assigned by receiving organisation. You will be notified once assigned.
                          </div>
                        </div>
                      )}

                      {/* Staff Handover & Delivery Verification Section (NGO Staff Only) */}
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Staff Handover & Delivery Verification</span>
                        </div>

                        {/* Pickup Confirmation Link (For Donor) */}
                        {pickupUrl && (
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-emerald-400">Donor Pickup Handover Link</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${pickup.confirmationTokens?.pickupUsedAt || isInTransit ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                {pickup.confirmationTokens?.pickupUsedAt || isInTransit ? 'Pickup Confirmed ✓' : 'Awaiting Donor Handover'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={pickupUrl}
                                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-[11px] font-mono select-all"
                              />
                              <button
                                onClick={() => handleCopyLink(pickupUrl, `pickup-${pickup._id}`)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedToken === `pickup-${pickup._id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedToken === `pickup-${pickup._id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                              <a
                                href={`https://wa.me/${(counterpartPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${counterpartName || 'Donor'}, here is your pickup handover confirmation link for "${pickup.title}":\n\n${pickupUrl}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                                title="Share Handover Link with Donor via WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share with Donor</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Delivery Confirmation Link (For NGO) */}
                        {deliveryUrl && (
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-amber-400">NGO Delivery Confirmation Link</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isCompleted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                {isCompleted ? 'Delivered & Received ✓' : 'Awaiting NGO Receipt'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={deliveryUrl}
                                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg text-[11px] font-mono select-all"
                              />
                              <button
                                onClick={() => handleCopyLink(deliveryUrl, `delivery-${pickup._id}`)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedToken === `delivery-${pickup._id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedToken === `delivery-${pickup._id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>

                            {/* NGO Inline Confirm Receipt Action */}
                            {!isDonor && !isCompleted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeliveryModalFood(pickup);
                                  setDeliveryModalOpen(true);
                                }}
                                className="w-full py-2 mt-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <QrCode className="w-4 h-4" />
                                <span>Confirm Delivery Received & Scan Code</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Map Live Location Action */}
                      {isInTransit && !isCompleted && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                            <Navigation className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                            <span>Volunteer in-transit with live tracking</span>
                          </div>
                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/map?taskId=${pickup._id}`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>View on Live Map</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Donor 4-Digit Verification Code Section */}
                      {!isCompleted && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          {!isDonor ? (
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Handover 4-Digit Code</span>
                              <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-[0.2em] mt-0.5">{pickup.verificationCode || '----'}</div>
                              <p className="text-[11px] text-slate-400 mt-1">Provide this code to the donor upon pickup if confirming manually.</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Verify Manual 4-Digit Code</span>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  maxLength="4"
                                  placeholder="4-digit code"
                                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono tracking-widest text-slate-800 dark:text-white dark:bg-slate-800 font-bold text-xs"
                                  value={verifyCode}
                                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                />
                                <button 
                                  onClick={() => handleVerifyCode(pickup._id)}
                                  disabled={verifyCode.length !== 4 || verifyingId === pickup._id}
                                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center cursor-pointer"
                                >
                                  {verifyingId === pickup._id ? 'Verifying...' : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify</>}
                                </button>
                              </div>
                              {error && verifyingId === pickup._id && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Archived History Link */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Delivered tasks are automatically archived into History.</span>
          <button
            onClick={() => {
              onClose();
              navigate('/activity');
            }}
            className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>View History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      <DeliveryConfirmationModal
        isOpen={deliveryModalOpen}
        onClose={() => {
          setDeliveryModalOpen(false);
          setDeliveryModalFood(null);
          fetchPickups();
        }}
        food={deliveryModalFood}
      />
    </Drawer>
  );
};

export default ActivePickupsDrawer;
