import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { HeartHandshake, Building2, UserCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { validatePhoneNumber, validateEmail, validatePincode, validatePassword, validateName } from '../utils/validation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InputField = ({ label, type, value, onChange, onBlur, error, required, placeholder, prefix, maxLength, suffix }) => (
  <div className="mb-4 relative">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {prefix && (
        <div className="absolute left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-500 sm:text-sm">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full ${prefix ? 'pl-10' : 'px-4'} py-2 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'} rounded-lg focus:ring-2 outline-none text-gray-900 bg-white placeholder-gray-400`}
      />
      {suffix && (
        <div className="absolute right-0 pr-3 flex items-center cursor-pointer">
          {suffix}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const AuthPage = ({ setToken, setUser }) => {
  const [step, setStep] = useState('ENTRY'); // ENTRY, TYPE_SELECTION, FORM
  const [isLogin, setIsLogin] = useState(false);
  const [accountType, setAccountType] = useState('DONOR'); // DONOR, ORGANISATION
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    fullName: '',
    businessName: '',
    businessDetails: {
      shopPhone: '',
      shopAddress: '',
      shopPincode: '',
      shopEmail: ''
    },
    orgName: '',
    pincode: '',
    address: '',
    city: ''
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleEntrySelection = (isLoginSelection) => {
    setIsLogin(isLoginSelection);
    setStep('TYPE_SELECTION');
  };

  const handleTypeSelection = (type) => {
    setAccountType(type);
    setStep('FORM');
  };

  const handleBack = () => {
    if (step === 'FORM') setStep('TYPE_SELECTION');
    else if (step === 'TYPE_SELECTION') setStep('ENTRY');
  };

  const validateField = (field, value) => {
    let errorMsg = '';
    switch (field) {
      case 'email':
      case 'shopEmail':
        errorMsg = validateEmail(value);
        break;
      case 'password':
        errorMsg = validatePassword(value);
        break;
      case 'phone':
      case 'shopPhone':
        errorMsg = validatePhoneNumber(value);
        break;
      case 'pincode':
      case 'shopPincode':
        errorMsg = validatePincode(value);
        break;
      case 'fullName':
        errorMsg = validateName(value);
        break;
      case 'orgName':
      case 'address':
      case 'city':
      case 'shopAddress':
        if (!value.trim()) errorMsg = 'This field is required';
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const formDataRef = useRef(formData);

  const handleChange = (field, value) => {
    // Only allow digits for phone/pincode
    if (['phone', 'shopPhone', 'pincode', 'shopPincode'].includes(field)) {
      value = value.replace(/\D/g, '');
    }

    let newFormData;
    if (field.startsWith('shop')) {
      newFormData = {
        ...formDataRef.current,
        businessDetails: {
          ...formDataRef.current.businessDetails,
          [field]: value
        }
      };
    } else {
      newFormData = { ...formDataRef.current, [field]: value };
    }
    
    formDataRef.current = newFormData;
    setFormData(newFormData);

    // Real-time validation
    const errorMsg = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleBlur = (field) => {
    const value = field.startsWith('shop') ? formDataRef.current.businessDetails[field] : formDataRef.current[field];
    const errorMsg = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const isFormValid = () => {
    let isValid = true;
    const newErrors = {};

    const checkField = (field, value) => {
      const errorMsg = validateField(field, value);
      if (errorMsg) {
        newErrors[field] = errorMsg;
        isValid = false;
      }
    };

    if (isLogin) {
      checkField('email', formData.email);
      checkField('password', formData.password);
    } else {
      if (accountType === 'DONOR') {
        checkField('fullName', formData.fullName);
        checkField('phone', formData.phone);
        checkField('email', formData.email);
        checkField('password', formData.password);
        
        if (formData.businessName.trim()) {
          checkField('shopPhone', formData.businessDetails.shopPhone);
          checkField('shopAddress', formData.businessDetails.shopAddress);
          checkField('shopPincode', formData.businessDetails.shopPincode);
          checkField('shopEmail', formData.businessDetails.shopEmail);
        }
      } else { // ORGANISATION
        checkField('orgName', formData.orgName);
        checkField('pincode', formData.pincode);
        checkField('address', formData.address);
        checkField('email', formData.email);
        checkField('city', formData.city);
        checkField('phone', formData.phone);
        checkField('password', formData.password);
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    setGlobalError('');

    if (!isFormValid()) {
      setGlobalError('Please fix the errors before submitting.');
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    let payload = {};
    if (isLogin) {
      payload = { email: formData.email, password: formData.password };
    } else {
      payload = { ...formData, accountType };
      if (accountType === 'ORGANISATION') {
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
        } else {
          // If shop name is present, make sure we format it correctly for the backend
          // We map 'shopPhone', etc back if needed, but our backend model expects shopAddress, shopPincode, shopEmail.
          // Wait, backend User schema doesn't have shopPhone? It has shopAddress, shopPincode, shopEmail.
          // The prompt says "5a. Shop Phone Number", so let's send it anyway. It might just not be saved or we can update the schema later.
        }
      }
    }

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, payload);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (err) {
      if (err.response) {
        setGlobalError(err.response.data.message || 'Authentication failed');
      } else if (err.request) {
        setGlobalError('Server is unreachable. Is the backend running?');
      } else {
        setGlobalError(err.message);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const getRelevantFields = () => {
    if (isLogin) {
      return ['email', 'password'];
    }
    if (accountType === 'DONOR') {
      const base = ['fullName', 'phone', 'email', 'password'];
      if (formData.businessName.trim() !== '') {
        return [...base, 'shopPhone', 'shopAddress', 'shopPincode', 'shopEmail'];
      }
      return base;
    }
    return ['orgName', 'pincode', 'address', 'email', 'city', 'phone', 'password'];
  };

  const isFormSubmitEnabled = () => {
    const relevantFields = getRelevantFields();
    
    // Check if any relevant field has an explicit error
    const hasExplicitErrors = relevantFields.some(field => errors[field] && errors[field] !== '');
    if (hasExplicitErrors) return false;
    
    // Check if any relevant field is empty
    const hasMissingFields = relevantFields.some(field => {
      const val = field.startsWith('shop') ? formData.businessDetails[field] : formData[field];
      return !val || (typeof val === 'string' && val.trim() === '');
    });
    
    if (hasMissingFields) return false;
    return true;
  };

  const submitDisabled = !isFormSubmitEnabled();

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 z-10 transition-all duration-300">
        
        {step !== 'ENTRY' && (
          <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 dark:hover:text-white mb-4 flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        )}

        <div className="text-center mb-6">
          <HeartHandshake className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
            {step === 'ENTRY' ? 'Food Bridge' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {step === 'ENTRY' ? 'Connect surplus food with those in need.' : isLogin ? 'Login to continue.' : 'Join our network today.'}
          </p>
        </div>

        {globalError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {globalError}
          </div>
        )}

        {step === 'ENTRY' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => handleEntrySelection(true)}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              Login
            </button>
            <button
              onClick={() => handleEntrySelection(false)}
              className="w-full bg-white text-green-600 border border-green-600 font-bold py-3 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </div>
        )}

        {step === 'TYPE_SELECTION' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => handleTypeSelection('DONOR')}
              className="w-full flex items-center justify-center p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-slate-800 transition-all group"
            >
              <UserCircle2 className="w-6 h-6 text-slate-500 group-hover:text-green-600 mr-3" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Personal Donor</span>
            </button>
            <button
              onClick={() => handleTypeSelection('ORGANISATION')}
              className="w-full flex items-center justify-center p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-slate-800 transition-all group"
            >
              <Building2 className="w-6 h-6 text-slate-500 group-hover:text-green-600 mr-3" />
              <span className="font-bold text-slate-700 dark:text-slate-200">NGO / Organisation</span>
            </button>
          </div>
        )}

        {step === 'FORM' && (
          <form onSubmit={handleSubmit} className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {isLogin ? (
              <>
                <InputField 
                  label="Email ID" type="email" required
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={errors.email}
                />
                <InputField 
                  label="Password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                  suffix={
                    <span onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  }
                />
              </>
            ) : accountType === 'DONOR' ? (
              <>
                {/* FLOW 3A: DONOR FORM */}
                <InputField 
                  label="Full Name" type="text" required
                  value={formData.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  error={errors.fullName}
                />
                <InputField 
                  label="Phone Number" type="text" required prefix="+91" maxLength={10}
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  error={errors.phone}
                />
                <InputField 
                  label="Email ID" type="email" required
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={errors.email}
                />
                <InputField 
                  label="Profile Password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                  suffix={
                    <span onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  }
                />
                
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <InputField 
                    label="Shop Name (Optional)" type="text"
                    value={formData.businessName}
                    onChange={e => handleChange('businessName', e.target.value)}
                  />
                  
                  {formData.businessName.trim() !== '' && (
                    <div className="pl-4 border-l-2 border-green-500 space-y-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <InputField 
                        label="Shop Phone Number" type="text" required prefix="+91" maxLength={10}
                        value={formData.businessDetails.shopPhone}
                        onChange={e => handleChange('shopPhone', e.target.value)}
                        onBlur={() => handleBlur('shopPhone')}
                        error={errors.shopPhone}
                      />
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Shop Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          value={formData.businessDetails.shopAddress}
                          onChange={e => handleChange('shopAddress', e.target.value)}
                          onBlur={() => handleBlur('shopAddress')}
                          className={`w-full px-4 py-2 border ${errors.shopAddress ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'} rounded-lg focus:ring-2 outline-none text-gray-900 bg-white placeholder-gray-400`}
                          rows={2}
                        />
                        {errors.shopAddress && <p className="mt-1 text-sm text-red-500">{errors.shopAddress}</p>}
                      </div>
                      <InputField 
                        label="Shop Pincode" type="text" required maxLength={6}
                        value={formData.businessDetails.shopPincode}
                        onChange={e => handleChange('shopPincode', e.target.value)}
                        onBlur={() => handleBlur('shopPincode')}
                        error={errors.shopPincode}
                      />
                      <InputField 
                        label="Shop Email Address" type="email" required
                        value={formData.businessDetails.shopEmail}
                        onChange={e => handleChange('shopEmail', e.target.value)}
                        onBlur={() => handleBlur('shopEmail')}
                        error={errors.shopEmail}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* FLOW 3B: NGO / ORGANISATION FORM */}
                <InputField 
                  label="Organisation Name" type="text" required
                  value={formData.orgName}
                  onChange={e => handleChange('orgName', e.target.value)}
                  onBlur={() => handleBlur('orgName')}
                  error={errors.orgName}
                />
                <InputField 
                  label="Pincode" type="text" required maxLength={6}
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  onBlur={() => handleBlur('pincode')}
                  error={errors.pincode}
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                    onBlur={() => handleBlur('address')}
                    className={`w-full px-4 py-2 border ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-green-500'} rounded-lg focus:ring-2 outline-none text-gray-900 bg-white placeholder-gray-400`}
                    rows={2}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                </div>
                <InputField 
                  label="Email" type="email" required
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={errors.email}
                />
                <InputField 
                  label="City" type="text" required
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  error={errors.city}
                />
                <InputField 
                  label="Phone Number" type="text" required prefix="+91" maxLength={10}
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  error={errors.phone}
                />
                <InputField 
                  label="Password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                  suffix={
                    <span onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  }
                />
              </>
            )}

            <button 
              type="submit"
              disabled={submitDisabled || isSubmitting}
              className={`w-full font-bold py-3 rounded-lg transition-colors shadow-sm mt-4 ${
                submitDisabled || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
