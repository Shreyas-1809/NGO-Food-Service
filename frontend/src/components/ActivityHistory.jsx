import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Loader2, Search, Filter, Package, Activity, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import HistoryDetailDrawer from './HistoryDetailDrawer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ActivityHistory = ({ token, user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  // Filtering state
  const [statusTab, setStatusTab] = useState('ALL'); // ALL, SENT, ACCEPTED, DECLINED, PENDING
  const [searchTerm, setSearchTerm] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Record
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    setErrorDetails('');
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      const res = await axios.get(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      let userMsg = 'Could not load donation history.';
      let details = '';

      if (!err.response) {
        // Network failure, CORS or backend offline
        userMsg = 'Network Error: Unable to reach the server. Please check your connection or ensure backend is running.';
        details = err.message;
      } else if (err.response.status === 404) {
        userMsg = 'API Endpoint Not Found (404): The history service route is not available on the server.';
        details = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
      } else if (err.response.status === 401 || err.response.status === 403) {
        userMsg = 'Authentication / Permission Error: Your session may have expired.';
        details = err.response.data?.message || err.response.statusText;
      } else {
        userMsg = `Server Error (${err.response.status}): Could not load donation history.`;
        details = err.response.data?.message || (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
      }

      setError(userMsg);
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Status / Direction Tabs
      if (statusTab === 'SENT') {
        if (item.direction !== 'SENT' && item.direction !== 'POSTED') return false;
      } else if (statusTab === 'ACCEPTED') {
        if (item.overallStatus !== 'ACCEPTED' && item.overallStatus !== 'COMPLETED') return false;
      } else if (statusTab === 'DECLINED') {
        if (item.overallStatus !== 'CANCELLED') return false;
      } else if (statusTab === 'PENDING') {
        if (item.overallStatus !== 'PENDING' && item.overallStatus !== 'ACTIVE') return false;
      }

      // 2. Search
      if (searchTerm && !item.itemTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 3. Quantity
      if (minQty && item.quantity < Number(minQty)) return false;
      if (maxQty && item.quantity > Number(maxQty)) return false;

      // 4. Date Range
      if (startDate) {
        if (new Date(item.createdAt) < new Date(startDate)) return false;
      }
      if (endDate) {
        // Add 1 day to endDate to make it inclusive for the selected day
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        if (new Date(item.createdAt) >= end) return false;
      }

      return true;
    });
  }, [history, statusTab, searchTerm, minQty, maxQty, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <Activity className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Donation & Fulfilment History</h1>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl p-6 mb-6 text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-red-800 dark:text-red-300">
            {error}
          </h3>
          {errorDetails && (
            <p className="text-xs font-mono text-red-600/80 dark:text-red-400/80 max-w-xl mx-auto bg-red-100/50 dark:bg-red-900/30 p-2.5 rounded-lg break-words">
              {errorDetails}
            </p>
          )}
          <div className="pt-2">
            <button
              onClick={fetchHistory}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading History</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter / Sort Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 space-y-4">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'SENT', label: 'Requests Sent' },
                { key: 'ACCEPTED', label: 'Accepted' },
                { key: 'PENDING', label: 'Unchecked / Pending' },
                { key: 'DECLINED', label: 'Declined' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                    statusTab === tab.key
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="number"
                  placeholder="Min Qty"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="number"
                  placeholder="Max Qty"
                  value={maxQty}
                  onChange={(e) => setMaxQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 md:col-span-2">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
                />
                <span className="text-slate-400">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center border border-slate-200 dark:border-slate-700">
                <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {history.length === 0 ? 'No donation or fulfilment activity recorded yet.' : 'No records match your filters.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div 
                  key={item._id} 
                  onClick={() => setSelectedRecord(item)}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.itemTitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-medium">{item.quantity} {item.unit}</span> • {item.otherPartyName}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={item.overallStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <HistoryDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
};

export default ActivityHistory;
