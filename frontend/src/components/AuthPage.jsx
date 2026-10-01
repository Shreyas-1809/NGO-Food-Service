import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRight, 
  Globe, 
  Sun, 
  Moon,
  Link as LinkIcon,
  Map as MapIcon,
  ShieldCheck,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';
import { validatePhoneNumber, validateEmail, validatePincode, validatePassword, validateName } from '../utils/validation';
import { T, useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InputField = ({ label, type, value, onChange, onBlur, error, required, placeholder, prefix, maxLength, suffix, icon: Icon }) => (
  <div className="mb-4 relative">
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
      <T text={label} /> {required && <span className="text-emerald-500">*</span>}
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
    {error && <p className="mt-1 text-[11px] font-bold text-rose-500"><T text={error} fallback={error} /></p>}
  </div>
);

const AuthPage = ({ setToken, setUser, isDarkMode, toggleTheme }) => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  const openAuth = (login = true) => {
    setIsLogin(login);
    setStep(login ? 'FORM' : 'TYPE_SELECTION');
    setIsAuthModalOpen(true);
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
      setIsAuthModalOpen(false);
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

  const featureCards = [
    {
      title: "Donor–NGO Matching",
      description: "Connect restaurants, bakeries and caterers with verified NGOs in minutes.",
      icon: LinkIcon,
      color: "text-emerald-500"
    },
    {
      title: "Live Map & Delivery Tracking",
      description: "View nearby surplus and track volunteers en-route on an interactive live map.",
      icon: MapIcon,
      color: "text-teal-500"
    },
    {
      title: "Multilingual Access",
      description: "The entire platform is available in six Indian languages, removing language barriers.",
      icon: Globe,
      color: "text-indigo-500"
    },
    {
      title: "Verified Partner Network",
      description: "Every donor and NGO is vetted, so surplus food reaches people safely.",
      icon: ShieldCheck,
      color: "text-blue-500"
    },
    {
      title: "Real-Time Surplus Listings",
      description: "Post surplus food instantly and let nearby NGOs claim it right away.",
      icon: Clock,
      color: "text-emerald-500"
    },
    {
      title: "Impact Analytics",
      description: "Track meals rescued, waste reduced and community impact with clear reports.",
      icon: TrendingUp,
      color: "text-teal-500"
    }
  ];

  return (
    <div className="min-h-screen w-full relative bg-[#f2faf5] dark:bg-[#061412] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      
      {/* Soft glowing background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-900/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 dark:bg-teal-900/20 blur-[100px]" />
      </div>

      {/* Floating Pill Navbar */}
      <div className="fixed top-4 left-0 w-full z-40 px-4 sm:px-6 flex justify-center">
        <nav className="w-full max-w-6xl flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-[#0c2521]/70 backdrop-blur-md rounded-full shadow-[0_4px_30px_rgba(16,185,129,0.1)] border border-white/20 dark:border-emerald-500/20">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm border border-emerald-200/50 dark:border-emerald-800/40">
              <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              FoodBridge
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700">
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900">
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/80 hover:bg-emerald-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-emerald-100 dark:border-slate-700 transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-emerald-600" />}
            </button>

            {/* Login Link */}
            <button onClick={() => openAuth(true)} className="hidden sm:block text-sm font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400 transition-colors cursor-pointer px-2">
              <T text="Login" />
            </button>

            {/* Sign Up Button */}
            <button onClick={() => openAuth(false)} className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer">
              <T text="Sign Up" />
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 w-full max-w-7xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          <T text="Connecting Surplus Meals" /><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
            <T text="With Local Shelters" />
          </span>
        </h1>
        
        <p className="mt-8 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl italic font-medium" style={{ fontFamily: 'Lora, serif' }}>
          <T text="Join our verified ecosystem of caring restaurants, bakeries, caterers, and active NGOs making zero food waste a daily reality." />
        </p>

        <button onClick={() => openAuth(false)} className="mt-10 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg font-bold shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 cursor-pointer flex items-center space-x-2">
          <span><T text="Get Started" /></span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 w-full max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            <T text="Features" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map((card, idx) => (
            <div 
              key={idx} 
              className={`group relative p-8 rounded-[32px] bg-white/60 dark:bg-[#0c2521]/60 backdrop-blur-sm border border-emerald-100 dark:border-emerald-800/40 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-105 hover:z-10 h-full w-full`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-800/50 group-hover:scale-110 transition-transform duration-300">
                <card.icon className={`w-6 h-6 ${card.color} dark:brightness-125`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                <T text={card.title} />
              </h3>
              <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed text-sm" style={{ fontFamily: 'Lora, serif' }}>
                <T text={card.description} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mt-20 border-t border-emerald-100/60 dark:border-emerald-950/40">
        <T text="FoodBridge © 2026 — Surplus Food Rescue Network" />
      </footer>

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0c2521] p-8 sm:p-9 rounded-[32px] border border-emerald-200/80 dark:border-emerald-500/40 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {step === 'FORM' && !isLogin && (
              <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 flex items-center transition-colors text-xs font-bold cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" /> <T text="Back" />
              </button>
            )}

            {/* Emblem Header */}
            <div className="text-center space-y-2 mt-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-300/40">
                <Heart className="w-6 h-6 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLogin ? <T text="Welcome Back" /> : <T text="Create Account" />}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isLogin ? <T text="Login to continue." /> : <T text="Join our verified network today." />}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#f3faf6] dark:bg-slate-800/80 p-1 rounded-2xl border border-emerald-100 dark:border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setStep('FORM'); resetForm(); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  isLogin
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <T text="Login" />
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
                <T text="Sign Up" />
              </button>
            </div>

            {globalError && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold text-center border border-rose-200 dark:border-rose-800 mb-4">
                <T text={globalError} fallback={globalError} />
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
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs"><T text="Personal Donor" /></span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400"><T text="Individuals, catering, or local restaurants" /></span>
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
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs"><T text="NGO / Organisation" /></span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400"><T text="Verified community charities & shelters" /></span>
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

            <div className="pt-6 text-center space-y-3">
              <div className="text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400 italic flex items-center justify-center space-x-1" style={{ fontFamily: 'Lora, serif' }}>
                <span><T text="Together we feed hope ♥" /></span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AuthPage;
