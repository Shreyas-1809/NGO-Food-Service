import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationsDrawer = ({ user, socket, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNewListing = (listing) => {
      if (user.accountType === 'ORGANISATION') {
        setNotifications(prev => [{ id: Date.now(), text: `New food available: ${listing.title}`, time: new Date() }, ...prev]);
      }
    };
    
    const handleListingUpdate = (listing) => {
      if (listing.status === 'CLAIMED' && user.accountType === 'DONOR' && listing.donorId === user.id) {
        setNotifications(prev => [{ id: Date.now(), text: `Your food "${listing.title}" was claimed!`, time: new Date() }, ...prev]);
      }
      if (listing.status === 'COMPLETED' && (listing.donorId === user.id || listing.claimantId === user.id)) {
        setNotifications(prev => [{ id: Date.now(), text: `Handover for "${listing.title}" completed successfully.`, time: new Date() }, ...prev]);
      }
    };

    socket.on('NEW_FOOD_LISTING', handleNewListing);
    socket.on('LISTING_UPDATED', handleListingUpdate);

    return () => {
      socket.off('NEW_FOOD_LISTING', handleNewListing);
      socket.off('LISTING_UPDATED', handleListingUpdate);
    };
  }, [socket, user]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-green-600" /> Notifications
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            No new notifications.
          </div>
        ) : (
          notifications.map(note => (
            <div key={note.id} className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-100 dark:border-slate-600">
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{note.text}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">{note.time.toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDrawer;
