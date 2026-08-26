import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import LiveFeed from './LiveFeed';
import DonorPostForm from './DonorPostForm';
import MyPostingsDrawer from './MyPostingsDrawer';
import MyShortagesDrawer from './MyShortagesDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import OrgPostNeedModal from './OrgPostNeedModal';
import { Plus, Package, Truck, Bell, Utensils, Scale, AlertCircle, FilePlus, Edit } from 'lucide-react';

import { getStoredNotifications, subscribeToDonationUpdates } from '../services/donationService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = ({ socket, user, token, autoOpenDonate = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPostForm, setShowPostForm] = useState(autoOpenDonate || location.pathname === '/donate' || Boolean(location.state?.prefill));
  const [showOrgNeedModal, setShowOrgNeedModal] = useState(false);
  const [prefillData, setPrefillData] = useState(location.state?.prefill || null);
  const [activeDrawer, setActiveDrawer] = useState(null); // 'POSTINGS', 'PICKUPS', 'NOTIFICATIONS', null
  const [unreadCount, setUnreadCount] = useState(0);

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  useEffect(() => {
    if (autoOpenDonate || location.pathname === '/donate' || location.state?.prefill) {
      setShowPostForm(true);
      if (location.state?.prefill) {
        setPrefillData(location.state.prefill);
      }
    }
  }, [autoOpenDonate, location.pathname, location.state]);

  const handleClosePostForm = () => {
    setShowPostForm(false);
    setPrefillData(null); // Clear prefill on close to avoid sticky edit state
    if (location.pathname === '/donate') {
      navigate('/', { replace: true });
    }
  };

  const handleEditPosting = (post) => {
    setPrefillData({ ...post, isEdit: true });
    setShowPostForm(true);
    setActiveDrawer(null);
  };

  const fetchNotificationsCount = async () => {
    let count = 0;

    // 1. Local stored unread notifications
    try {
      const stored = getStoredNotifications();
      const unreadStored = stored.filter(n => {
        if (['notif-1', 'notif-2', 'notif-3'].includes(n.id)) return false;
        if (n.read) return false;
        if (isOrg) return n.targetRole === 'ORGANISATION';
        return n.targetRole === 'DONOR';
      }).length;
      count += unreadStored;
    } catch (e) {}

    // 2. Backend unread notifications
    try {
      if (user && user.id && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadBackend = (res.data || []).filter(n => !n.read).length;
        count += unreadBackend;
      }
    } catch (err) {
      // Backend silent fallback
    }

    setUnreadCount(count);
  };

  useEffect(() => {
    fetchNotificationsCount();

    // Pub/sub live listener
    const unsubscribe = subscribeToDonationUpdates(fetchNotificationsCount);

    // Cross-tab storage change listener
    const handleStorage = (e) => {
      if (e.key === 'donor_bridge_notifications_v1' || e.key === 'donor_bridge_donations_v1' || e.key === 'donor_bridge_requests_v1') {
        fetchNotificationsCount();
      }
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(fetchNotificationsCount, 10000); // 10s polling
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [user, token, isOrg]);

  const closeDrawer = () => {
    setActiveDrawer(null);
    fetchNotificationsCount(); // refresh count when closing drawer
  };

  return (
    <div className="flex flex-1 w-full relative overflow-hidden bg-slate-50 dark:bg-slate-900">

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome & Impact Metrics Bar */}
          {/* Top Spacing / Content Start */}
          <div className="pt-2"></div>

          {/* Post Food Modal Overlay (Donor) */}
          {showPostForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-300">
                <button
                  onClick={handleClosePostForm}
                  className="absolute -top-10 right-0 text-white hover:text-slate-200 flex items-center font-bold text-sm"
                >
                  Close <span className="text-2xl ml-1.5 font-normal">&times;</span>
                </button>
                <DonorPostForm
                  socket={socket}
                  user={user}
                  token={token}
                  prefill={prefillData}
                  onSuccess={handleClosePostForm}
                />
              </div>
            </div>
          )}

          {/* Post Need Modal Overlay (Organisation) */}
          {showOrgNeedModal && (
            <OrgPostNeedModal
              user={user}
              token={token}
              onClose={() => setShowOrgNeedModal(false)}
              onSuccess={() => {}}
            />
          )}

          {/* Live Feed */}
          <LiveFeed socket={socket} user={user} token={token} onEdit={handleEditPosting} />
        </div>
      </main>

      {/* Drawers Container (Slide-over) */}
      <div className={`w-96 shrink-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transition-all duration-300 ease-in-out z-40 ${activeDrawer ? 'translate-x-0 ml-0' : 'translate-x-full absolute right-20 top-0 bottom-0'}`} style={{ position: activeDrawer ? 'relative' : 'absolute' }}>
        {activeDrawer === 'POSTINGS' && <MyPostingsDrawer user={user} token={token} onClose={closeDrawer} onEdit={handleEditPosting} />}
        {activeDrawer === 'SHORTAGES' && <MyShortagesDrawer token={token} onClose={closeDrawer} />}
        {activeDrawer === 'NOTIFICATIONS' && <NotificationsDrawer user={user} token={token} socket={socket} onClose={closeDrawer} />}
      </div>

      {/* Right-Hand Icon Navigation Bar */}
      <aside className="w-20 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-6 gap-6 shrink-0 z-50">
        {/* DONOR SIDEBAR */}
        {user.accountType === 'DONOR' && (
          <>
            <button
              onClick={() => { closeDrawer(); setShowPostForm(true); }}
              className="w-12 h-12 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-emerald-400 flex justify-center items-center transition-colors group relative cursor-pointer"
              title="Post Surplus Food"
            >
              <Plus className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Post Food</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'POSTINGS' ? null : 'POSTINGS')}
              className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative cursor-pointer ${activeDrawer === 'POSTINGS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
              title="Edit Postings"
            >
              <Edit className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Edit Postings</span>
            </button>
          </>
        )}

        {/* ORGANISATION / NGO SIDEBAR */}
        {user.accountType === 'ORGANISATION' && (
          <>
            <button
              onClick={() => { closeDrawer(); setShowOrgNeedModal(true); }}
              className="w-12 h-12 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-amber-400 flex justify-center items-center transition-colors group relative cursor-pointer"
              title="Post Shortage / Need"
            >
              <Plus className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Post Shortage</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'SHORTAGES' ? null : 'SHORTAGES')}
              className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative cursor-pointer ${activeDrawer === 'SHORTAGES' ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'}`}
              title="My Shortages & Needs"
            >
              <Package className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">My Shortages</span>
            </button>
          </>
        )}

        {/* SHARED NOTIFICATIONS ICON */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
          className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative cursor-pointer ${activeDrawer === 'NOTIFICATIONS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
          title="Notifications"
        >
          <div className="relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Notifications</span>
        </button>
      </aside>

    </div>
  );
};

export default Dashboard;
