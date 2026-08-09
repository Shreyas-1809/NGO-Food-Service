import React, { useState } from 'react';
import axios from 'axios';
import { HeartHandshake, Building2, UserCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthPage = ({ setToken, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    accountType: 'ORGANISATION',
    email: '',
    password: '',
    phone: '',
    orgName: '',
    city: '',
    pincode: '',
    address: '',
    fullName: '',
    businessName: '',
    businessDetails: {
      shopAddress: '',
      shopPincode: '',
      shopEmail: ''
    }
  });
  const [error, setError] = useState('');

  const handleNestedChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    // Clean up payload based on accountType so we don't send unused fields
    let payload = { ...formData };
    if (!isLogin) {
      if (formData.accountType === 'ORGANISATION') {
        delete payload.fullName;
        delete payload.businessName;
        delete payload.businessDetails;
      } else {
        delete payload.orgName;
        delete payload.city;
        delete payload.pincode;
        delete payload.address;
        if (!payload.businessName) {
          delete payload.businessDetails;
        }
      }
    } else {
      payload = { email: formData.email, password: formData.password };
    }

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Authentication failed');
      } else if (err.request) {
        setError('Server is unreachable. Is the backend running?');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 z-10">
        <div className="text-center mb-6">
          <HeartHandshake className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{isLogin ? 'Login to continue bridging food gaps.' : 'Join the network to rescue surplus food.'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>{error}</span>
            {isLogin && error.includes('No account found') && (
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className="underline font-bold hover:text-red-800"
              >
                Switch to Sign Up
              </button>
            )}
          </div>
        )}

        {!isLogin && (
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'ORGANISATION' })}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${
                formData.accountType === 'ORGANISATION' 
                  ? 'bg-white shadow-sm text-green-700' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Organisation (NGO/Shelter)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'DONOR' })}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${
                formData.accountType === 'DONOR' 
                  ? 'bg-white shadow-sm text-green-700' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCircle2 className="w-4 h-4 mr-2" />
              Personal / Donor
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email and Password - Always visible */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {!isLogin && (
            <>
              {/* Common extra field for Sign up */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* ORGANISATION Fields */}
              {formData.accountType === 'ORGANISATION' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organisation Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                      value={formData.orgName}
                      onChange={e => setFormData({...formData, orgName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                        value={formData.pincode}
                        onChange={e => setFormData({...formData, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DONOR Fields */}
              {formData.accountType === 'DONOR' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Food Shop / Business Name (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., ABC Bakery"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400 focus:text-gray-900 focus:bg-white"
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>

                  {/* Dynamic Expansion for Business Details */}
                  {formData.businessName.trim().length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <h4 className="text-sm font-bold text-slate-700">Business Details</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Shop Address</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400"
                          value={formData.businessDetails.shopAddress}
                          onChange={e => handleNestedChange('shopAddress', e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Shop Pincode</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400"
                            value={formData.businessDetails.shopPincode}
                            onChange={e => handleNestedChange('shopPincode', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Shop Email (Optional)</label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white placeholder-gray-400"
                            value={formData.businessDetails.shopEmail}
                            onChange={e => handleNestedChange('shopEmail', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button 
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm mt-4"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-green-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
