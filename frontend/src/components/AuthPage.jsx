import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Heart, 
  Building2, 
  UserCircle2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Leaf, 
  Users, 
  Check, 
  ArrowRight, 
  Globe, 
  Sun, 
  Moon 
} from 'lucide-react';
import { validatePhoneNumber, validateEmail, validatePincode, validatePassword, validateName } from '../utils/validation';
import HeroIllustration from './illustrations/HeroIllustration';
import { T, useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InputField = ({ label, type, value, onChange, onBlur, error, required, placeholder, prefix, maxLength, suffix, icon: Icon }) => (
  <div className="mb-4 relative">
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
      {label} {required && <span className="text-emerald-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
      )}
      {prefix && (
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{prefix}</span>
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
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        className={`w-full ${Icon || prefix ? 'pl-10' : 'px-4'} py-2.5 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
        } rounded-xl focus:ring-2 outline-none text-slate-900 dark:text-slate-100 bg-[#f8faf7] dark:bg-slate-800/90 placeholder-slate-400 transition-all text-xs font-medium`}
      />
      {suffix && (
        <div className="absolute right-3.5 flex items-center cursor-pointer">
          {suffix}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-[11px] font-bold text-rose-500">{error}</p>}
  </div>
);

const AuthPage = ({ setToken, setUser }) => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [step, setStep] = useState('FORM'); // TYPE_SELECTION, FORM
  const [isLogin, setIsLogin] = useState(true);
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
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const isSubmittingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const resetForm = () => {
    const emptyForm = {
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
    };
    formDataRef.current = emptyForm;
    setFormData(emptyForm);
    setErrors({});
    setGlobalError('');
  };

  const handleTypeSelection = (type) => {
    setAccountType(type);
    resetForm();
    setStep('FORM');
  };

  const handleBack = () => {
    resetForm();
    if (step === 'FORM') setStep('TYPE_SELECTION');
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

  const triggerPincodeLookup = async (pincodeVal) => {
    if (!pincodeVal || pincodeVal.length !== 6) return;
    setIsLoadingCity(true);
    try {
      const res = await axios.get(`https://api.postalpincode.in/pincode/${pincodeVal}`);
      if (res.data && res.data[0] && res.data[0].Status === "Success") {
        const postOffice = res.data[0].PostOffice?.[0];
        if (postOffice) {
          const fetchedCity = postOffice.District || postOffice.Region || postOffice.Block || postOffice.State;
          if (fetchedCity) {
            const updatedForm = { ...formDataRef.current, city: fetchedCity };
            formDataRef.current = updatedForm;
            setFormData(updatedForm);
            setErrors(prev => ({ ...prev, city: '' }));
          }
        }
      }
    } catch (err) {
      console.error("Pincode lookup failed", err);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const handleChange = (field, value) => {
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

    const errorMsg = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));

    if (field === 'pincode' && value.length === 6) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        triggerPincodeLookup(value);
      }, 300);
    }
  };

  const handleBlur = (field) => {
    const value = field.startsWith('shop') ? formDataRef.current.businessDetails[field] : formDataRef.current[field];
    const errorMsg = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));

    if (field === 'pincode' && value && value.length === 6) {
      triggerPincodeLookup(value);
    }
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
      } else {
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
    const hasExplicitErrors = relevantFields.some(field => errors[field] && errors[field] !== '');
    if (hasExplicitErrors) return false;
    
    const hasMissingFields = relevantFields.some(field => {
      const val = field.startsWith('shop') ? formData.businessDetails[field] : formData[field];
      return !val || (typeof val === 'string' && val.trim() === '');
    });
    
    if (hasMissingFields) return false;
    return true;
  };

  const submitDisabled = !isFormSubmitEnabled();

  return (
    <div className="min-h-screen w-full bg-[#f3faf6] dark:bg-[#061412] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
      
      {/* TOP NAVBAR (Matching Reference Screenshots) */}
      <header className="w-full px-6 lg:px-12 py-5 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-emerald-200/50 dark:border-emerald-800/40">
            <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            FoodBridge
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800/80 border border-emerald-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
            <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1"
              aria-label="Select Language"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT GRID */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between gap-10 z-10">
        
        {/* Left Side: Hero Pitch & Illustration */}
        <div className="hidden lg:flex flex-col items-start max-w-xl space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-300/60 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold tracking-wide">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
            <span>Community Food Sharing Network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Connecting surplus meals <br />
            <span className="text-emerald-600 dark:text-emerald-400">with local shelters</span>
          </h1>

          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
            Join our verified ecosystem of caring restaurants, bakeries, caterers, and active NGOs making zero food waste a daily reality.
          </p>

          {/* 3 Feature Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-800/50 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <span>Reduce Food Waste</span>
            </div>

            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-800/50 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Support Local Communities</span>
            </div>

            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-800/50 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              </div>
              <span>Make a Bigger Impact</span>
            </div>
          </div>

          {/* Handwritten Slogan Accent */}
          <div className="pt-2 flex items-center space-x-3 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm italic tracking-wide">
            <span>Good Food</span>
            <Check className="w-4 h-4 text-emerald-600 font-black" />
            <span>Happy People</span>
            <Check className="w-4 h-4 text-emerald-600 font-black" />
            <span>Greener Planet</span>
          </div>

          <div className="w-full pt-2">
            <HeroIllustration className="w-full max-w-[420px] h-auto drop-shadow-sm" />
          </div>

        </div>

        {/* Right Side: Auth Card (Matching Reference Screenshots EXACTLY) */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          
          <div className="bg-white/95 dark:bg-[#0c2521]/90 p-8 sm:p-9 rounded-[32px] border border-emerald-200/80 dark:border-emerald-500/40 shadow-xl shadow-emerald-900/10 dark:shadow-[0_0_45px_rgba(16,185,129,0.18)] backdrop-blur-md relative space-y-5">
            
            {step === 'FORM' && !isLogin && (
              <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 flex items-center transition-colors text-xs font-bold cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            )}

            {/* Emblem Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-300/40">
                <Heart className="w-6 h-6 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isLogin ? 'Login to continue.' : 'Join our verified network today.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#f3faf6] dark:bg-slate-800/80 p-1 rounded-2xl border border-emerald-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setStep('FORM'); resetForm(); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  isLogin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setStep('TYPE_SELECTION'); resetForm(); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  !isLogin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {globalError && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold text-center border border-rose-200 dark:border-rose-800">
                {globalError}
              </div>
            )}

            {step === 'TYPE_SELECTION' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => handleTypeSelection('DONOR')}
                  className="w-full flex items-center justify-center p-4 border-2 border-emerald-100 dark:border-slate-700 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mr-3 shrink-0">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs">Personal Donor</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Individuals, catering, or local restaurants</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTypeSelection('ORGANISATION')}
                  className="w-full flex items-center justify-center p-4 border-2 border-emerald-100 dark:border-slate-700 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mr-3 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs">NGO / Organisation</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Verified community charities & shelters</span>
                  </div>
                </button>
              </div>
            )}

            {step === 'FORM' && (
              <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-300">
                
                {isLogin ? (
                  <>
                    <InputField 
                      label="Email ID" type="email" required icon={Mail}
                      placeholder="e.g. ngo@example.com"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      error={errors.email}
                    />
                    <InputField 
                      label="Password" type={showPassword ? 'text' : 'password'} required icon={Lock}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      error={errors.password}
                      suffix={
                        <span onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </span>
                      }
                    />
                  </>
                ) : accountType === 'DONOR' ? (
                  <>
                    <InputField 
                      label="Full Name" type="text" required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      error={errors.fullName}
                    />
                    <InputField 
                      label="Phone Number" type="text" required prefix="+91" maxLength={10}
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      error={errors.phone}
                    />
                    <InputField 
                      label="Email ID" type="email" required icon={Mail}
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      error={errors.email}
                    />
                    <InputField 
                      label="Profile Password" type={showPassword ? 'text' : 'password'} required icon={Lock}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      error={errors.password}
                      suffix={
                        <span onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </span>
                      }
                    />
                  </>
                ) : (
                  <>
                    <InputField 
                      label="Organisation Name" type="text" required
                      placeholder="e.g. Robin Hood Army"
                      value={formData.orgName}
                      onChange={e => handleChange('orgName', e.target.value)}
                      onBlur={() => handleBlur('orgName')}
                      error={errors.orgName}
                    />
                    <InputField 
                      label="Pincode" type="text" required maxLength={6}
                      placeholder="e.g. 411001"
                      value={formData.pincode}
                      onChange={e => handleChange('pincode', e.target.value)}
                      onBlur={() => handleBlur('pincode')}
                      error={errors.pincode}
                    />
                    <InputField 
                      label="Email" type="email" required icon={Mail}
                      placeholder="e.g. contact@ngo.org"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      error={errors.email}
                    />
                    <InputField 
                      label="Phone Number" type="text" required prefix="+91" maxLength={10}
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      error={errors.phone}
                    />
                    <InputField 
                      label="Password" type={showPassword ? 'text' : 'password'} required icon={Lock}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      error={errors.password}
                      suffix={
                        <span onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </span>
                      }
                    />
                  </>
                )}

                <button 
                  type="submit"
                  disabled={submitDisabled || isSubmitting}
                  className={`w-full font-extrabold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 mt-4 cursor-pointer ${
                    submitDisabled || isSubmitting
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25'
                  }`}
                >
                  <span>{isSubmitting ? <T text="Processing..." /> : (isLogin ? <T text="Login" /> : <T text="Register" />)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Social Dividers & Decorative Handwritten Slogan */}
            <div className="pt-2 text-center space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-[#0c2521] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">or</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 hover:bg-slate-50 cursor-pointer">
                  <span>Google</span>
                </button>
                <button type="button" className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 hover:bg-slate-50 cursor-pointer">
                  <span>Apple</span>
                </button>
              </div>

              <div className="pt-2 text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400 italic flex items-center justify-center space-x-1">
                <span>Together we feed hope</span>
                <Heart className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 inline" />
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-emerald-100/60 dark:border-emerald-950/40">
        FoodBridge © {new Date().getFullYear()} — Surplus Food Rescue Network
      </footer>

    </div>
  );
};

export default AuthPage;

