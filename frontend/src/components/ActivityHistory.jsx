import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Loader2, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivityHistory = ({ token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActivities(res.data);
      } catch (err) {
        console.error('Failed to fetch activity history', err);
        setError('Could not load activity history.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchActivity();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity History</h1>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No recent activity found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activities.map((activity) => (
              <div key={activity._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full flex-shrink-0 mt-1">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-lg">
                    {activity.action}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {new Date(activity.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;
