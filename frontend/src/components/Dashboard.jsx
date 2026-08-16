import React, { useState } from 'react';
import LiveFeed from './LiveFeed';
import DonorPostForm from './DonorPostForm';
import MyPostingsDrawer from './MyPostingsDrawer';
import ActivePickupsDrawer from './ActivePickupsDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import { Plus, Package, Truck, Bell, Utensils, Scale } from 'lucide-react';

const Dashboard = ({ socket, user, token }) => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null); // 'POSTINGS', 'PICKUPS', 'NOTIFICATIONS', null

  const closeDrawer = () => setActiveDrawer(null);

  return (
    <div className="flex flex-1 w-full relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome & Impact Metrics Bar */}
          {/* Top Spacing / Content Start */}
          <div className="pt-2"></div>

          {/* Post Food Modal Overlay */}
          {showPostForm && user.accountType === 'DONOR' && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-300">
                <button 
                  onClick={() => setShowPostForm(false)}
                  className="absolute -top-12 right-0 text-white hover:text-slate-200 flex items-center font-bold"
                >
                  Close <span className="text-3xl ml-2 font-normal">&times;</span>
                </button>
                <DonorPostForm 
                  socket={socket} 
                  user={user}
                  token={token} 
                  onSuccess={() => setShowPostForm(false)} 
                />
              </div>
            </div>
          )}

          {/* Live Feed */}
          <LiveFeed socket={socket} user={user} token={token} />
        </div>
      </main>

      {/* Drawers Container (Slide-over) */}
      <div className={`w-96 shrink-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transition-all duration-300 ease-in-out z-40 ${activeDrawer ? 'translate-x-0 ml-0' : 'translate-x-full absolute right-20 top-0 bottom-0'}`} style={{ position: activeDrawer ? 'relative' : 'absolute' }}>
        {activeDrawer === 'POSTINGS' && <MyPostingsDrawer user={user} token={token} onClose={closeDrawer} />}
        {activeDrawer === 'PICKUPS' && <ActivePickupsDrawer user={user} token={token} onClose={closeDrawer} />}
        {activeDrawer === 'NOTIFICATIONS' && <NotificationsDrawer user={user} socket={socket} onClose={closeDrawer} />}
      </div>

      {/* Right-Hand Icon Navigation Bar */}
      <aside className="w-20 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-6 gap-6 shrink-0 z-50">
        {user.accountType === 'DONOR' && (
          <button 
            onClick={() => { closeDrawer(); setShowPostForm(true); }}
            className="w-12 h-12 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-emerald-400 flex justify-center items-center transition-colors group relative"
            title="Post Surplus Food"
          >
            <Plus className="w-6 h-6" />
            <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Post Food</span>
          </button>
        )}
        
        {user.accountType === 'DONOR' && (
          <button 
            onClick={() => setActiveDrawer(activeDrawer === 'POSTINGS' ? null : 'POSTINGS')}
            className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative ${activeDrawer === 'POSTINGS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
            title="My Postings"
          >
            <Package className="w-6 h-6" />
            <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">My Postings</span>
          </button>
        )}

        <button 
          onClick={() => setActiveDrawer(activeDrawer === 'PICKUPS' ? null : 'PICKUPS')}
          className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative ${activeDrawer === 'PICKUPS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
          title="Active Pickups"
        >
          <Truck className="w-6 h-6" />
          <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Active Pickups</span>
        </button>

        <button 
          onClick={() => setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
          className={`w-12 h-12 rounded-xl flex justify-center items-center transition-colors group relative ${activeDrawer === 'NOTIFICATIONS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'}`}
          title="Notifications"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute right-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Notifications</span>
        </button>
      </aside>

    </div>
  );
};

export default Dashboard;
