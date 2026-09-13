import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import LiveFeed from './LiveFeed';
import DonorPostForm from './DonorPostForm';
import MyPostingsDrawer from './MyPostingsDrawer';
import MyShortagesDrawer from './MyShortagesDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import OrgPostNeedModal from './OrgPostNeedModal';
import ActivePickupsDrawer from './ActivePickupsDrawer';
import { Plus, Package, Truck, Bell, Utensils, Scale, AlertCircle, FilePlus, Edit, HeartHandshake, Building2, ArrowRight } from 'lucide-react';
import IconCircleBadge from './ui/IconCircleBadge';

// donationService mock removed — notification count reads from real backend API

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

  useEffect(() => {
    const handleOpenDrawer = (e) => {
      if (e.detail) setActiveDrawer(e.detail);
    };
    window.addEventListener('OPEN_DRAWER', handleOpenDrawer);
    return () => window.removeEventListener('OPEN_DRAWER', handleOpenDrawer);
  }, []);

  const handleClosePostForm = () => {
    setShowPostForm(false);
    setPrefillData(null); // Clear prefill on close to avoid sticky edit state
    if (location.pathname === '/donate') {
      navigate('/', { replace: true });
    }
  };

  const handleEditPosting = (post) => {
    if (post.isNewPostSignal) {
      setPrefillData(null);
      setShowPostForm(true);
      setActiveDrawer(null);
      return;
    }
    
    // For reposts, we don't want isEdit to be true because it's a new post creation, just with prefilled data
    if (post.isRepost) {
      setPrefillData({ ...post, isEdit: false });
    } else {
      setPrefillData({ ...post, isEdit: true });
    }
    
    setShowPostForm(true);
    setActiveDrawer(null);
  };

  const fetchNotificationsCount = async () => {
    try {
      const uid = user?.id || user?._id;
      if (uid && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadBackend = (res.data || []).filter(n => !n.read).length;
        setUnreadCount(unreadBackend);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotificationsCount();

    if (socket) {
      const handleNewNotification = () => {
        fetchNotificationsCount();
      };
      socket.on('NEW_NOTIFICATION', handleNewNotification);
      socket.on('CLAIM_REQUEST_RECEIVED', handleNewNotification);
      socket.on('CLAIM_ACCEPTED', (data) => {
        handleNewNotification();
        if (isOrg) {
          setActiveDrawer('PICKUPS');
        }
      });
      socket.on('CLAIM_DECLINED', handleNewNotification);
      socket.on('NGO_CONFIRMED', handleNewNotification);
      socket.on('PICKUP_CONFIRMED', handleNewNotification);

      return () => {
        socket.off('NEW_NOTIFICATION', handleNewNotification);
        socket.off('CLAIM_REQUEST_RECEIVED', handleNewNotification);
        socket.off('CLAIM_ACCEPTED', handleNewNotification);
        socket.off('CLAIM_DECLINED', handleNewNotification);
        socket.off('NGO_CONFIRMED', handleNewNotification);
        socket.off('PICKUP_CONFIRMED', handleNewNotification);
      };
    }

    return () => {
      unsubscribe();
    };
  }, [user, token, isOrg, socket]);

  const closeDrawer = () => {
    setActiveDrawer(null);
    fetchNotificationsCount(); // refresh count when closing drawer
  };

  return (
    <div className="flex flex-1 w-full relative overflow-hidden bg-slate-50 dark:bg-slate-900">

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Spacing / Content Start */}
          <div className="pt-1 mb-6">
            {/* Quick Action Choices matching "choose an action" pattern */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  if (isOrg) {
                    setShowOrgNeedModal(true);
                  } else {
                    setShowPostForm(true);
                  }
                }}
                className="bg-white dark:bg-[#23201d] rounded-2xl border border-[#e8dfd2]/80 dark:border-[#38322c] shadow-[0_4px_20px_rgba(232,135,58,0.06)] hover:shadow-md hover:border-[#E8873A]/50 transition-all cursor-pointer group overflow-hidden"
              >
                {/* Card Photo Banner */}
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  <img
                    src="/images/donate-surplus.jpg"
                    alt="Surplus food donations ready for distribution"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <div className="absolute bottom-2.5 left-3">
                    <IconCircleBadge
                      icon={isOrg ? Plus : HeartHandshake}
                      color="orange"
                      size="lg"
                      variant="solid"
                      className="shadow-md"
                    />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-[#E8873A] transition-colors">
                      {isOrg ? 'Post Shortage / Need' : 'Donate Surplus Food'}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {isOrg ? 'Broadcast ingredient or ration deficits' : 'Share untouched meal portions with verified shelters'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E8873A]/10 text-[#E8873A] flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => navigate('/ngos')}
                className="bg-white dark:bg-[#23201d] rounded-2xl border border-[#e8dfd2]/80 dark:border-[#38322c] shadow-[0_4px_20px_rgba(47,122,77,0.06)] hover:shadow-md hover:border-[#2F7A4D]/50 transition-all cursor-pointer group overflow-hidden"
              >
                {/* Card Photo Banner */}
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  <img
                    src="/images/find-ngos.jpg"
                    alt="Community shelter kitchen volunteers sorting donations"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <div className="absolute bottom-2.5 left-3">
                    <IconCircleBadge
                      icon={Building2}
                      color="green"
                      size="lg"
                      variant="solid"
                      className="shadow-md"
                    />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-[#2F7A4D] dark:group-hover:text-[#86efac] transition-colors">
                      Find Verified NGOs
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Browse community kitchens, orphanages, and relief hubs
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#2F7A4D]/10 text-[#2F7A4D] dark:text-[#86efac] flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>



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

      {/* Drawers Container - Using Shared Drawer Component */}
      <>
        <MyPostingsDrawer isOpen={activeDrawer === 'POSTINGS'} user={user} token={token} onClose={closeDrawer} onEdit={handleEditPosting} />
        <MyShortagesDrawer isOpen={activeDrawer === 'SHORTAGES'} token={token} onClose={closeDrawer} />
        <NotificationsDrawer isOpen={activeDrawer === 'NOTIFICATIONS'} user={user} token={token} socket={socket} onClose={closeDrawer} onNotificationChange={fetchNotificationsCount} />
        {activeDrawer === 'PICKUPS' && (
          <div className="absolute top-0 right-20 w-96 h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-[100] animate-in slide-in-from-right duration-300">
            <ActivePickupsDrawer user={user} token={token} onClose={closeDrawer} />
          </div>
        )}
      </>

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
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'PICKUPS' ? null : 'PICKUPS')}
              className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative cursor-pointer ${activeDrawer === 'PICKUPS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
              title="Active Pickups"
            >
              <Truck className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Active Pickups</span>
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
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'PICKUPS' ? null : 'PICKUPS')}
              className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative cursor-pointer ${activeDrawer === 'PICKUPS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
              title="Active Pickups"
            >
              <Truck className="w-6 h-6" />
              <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">Active Pickups</span>
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
