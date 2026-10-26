import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
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
import Logo from './Logo';
import LightBackground from './LightBackground';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InputField = ({ label, type, value, onChange, onBlur, error, required, placeholder, prefix, maxLength, suffix, icon: Icon }) => (
  <div className="mb-4 relative">
    <label className="block text-xs font-bold text-[#18315E] dark:text-white mb-1.5">
      <T text={label} /> {required && <span className="text-[#18315E]">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#60708B]">
          <Icon className="w-4 h-4" />
        </div>
      )}
      {prefix && (
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          <span className="text-[#60708B] dark:text-slate-300 text-xs font-bold">{prefix}</span>
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
          error ? 'border-[#E5E1D8] focus:ring-[#E5E1D8]' : 'border-[#E5E1D8] dark:border-[#1E2D52] focus:ring-[#E5E1D8]'
        } rounded-xl focus:ring-2 outline-none text-[#18315E] dark:text-white bg-[#F3F0EA] dark:bg-[#0F1A33]/90 placeholder-[#60708B] transition-all text-xs font-medium`}
      />
      {suffix && (
        <div className="absolute right-3.5 flex items-center cursor-pointer">
          {suffix}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-[11px] font-bold text-[#E5B85C]"><T text={error} fallback={error} /></p>}
  </div>
);

const dustDots = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 17) % 100}%`,
  size: `${1 + (i % 3)}px`,
  duration: `${10 + (i % 16)}s`,
  delay: `-${(i * 0.8).toFixed(1)}s`,
}));

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
  const [,setIsLoadingCity] = useState(false);
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
        checkField('email', formData.email);
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
      console.error('Signup error:', err);
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
    return ['orgName', 'pincode', 'email', 'phone', 'password'];
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
      color: "text-[#18315E]"
    },
    {
      title: "Live Map & Delivery Tracking",
      description: "Follow volunteers in real time on the map, from pickup to delivery.",
      icon: MapIcon,
      color: "text-[#E5B85C]"
    },
    {
      title: "Multilingual Access",
      description: "The entire platform is available in six Indian languages, removing language barriers.",
      icon: Globe,
      color: "text-[#E5B85C]"
    },
    {
      title: "Verified Partner Network",
      description: "Every donor and NGO is vetted, so surplus food reaches people safely.",
      icon: ShieldCheck,
      color: "text-[#18315E]"
    },
    {
      title: "Real-Time Surplus Listings",
      description: "Post surplus food instantly and let nearby NGOs claim it right away.",
      icon: Clock,
      color: "text-[#18315E]"
    },
    {
      title: "Impact Analytics",
      description: "Track meals rescued, waste reduced and community impact with clear reports.",
      icon: TrendingUp,
      color: "text-[#E5B85C]"
    }
  ];

  return (
    <>
      <LightBackground />

      <div className="min-h-screen w-full relative z-[1] bg-transparent dark:bg-[#070E1E] text-[#172746] dark:text-white overflow-x-hidden font-sans">

      
      {/* Soft glowing background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#173B78]/10 dark:bg-[#0F1A33]/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#E5B85C]/10 dark:bg-[#0F1A33]/20 blur-[100px]" />
      </div>

      {/* Floating Pill Navbar */}
      <div className="fixed top-4 left-0 w-full z-40 px-4 sm:px-6 flex justify-center">
        <nav className="w-full max-w-6xl flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-[#0A1328]/70 backdrop-blur-md rounded-full shadow-[0_4px_30px_rgba(23,59,120,0.08)] dark:shadow-[0_4px_30px_rgba(76,130,232,0.15)] border border-[#E5E1D8]/40 dark:border-[#1E2D52]/40">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <Logo size={40} />
            <span className="text-xl font-black tracking-tight text-[#18315E] dark:text-white">
              FoodBridge
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-[#0F1A33]/80 border border-[#E5E1D8] dark:border-[#1E2D52]">
              <Globe className="h-3.5 w-3.5 text-[#18315E] dark:text-[#D9B65D] shrink-0" />
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#18315E] dark:text-white border-none outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#0F1A33]">
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#60708B] hover:text-[#173B78] dark:text-slate-300 dark:hover:text-[#ECE9E1] bg-white/80 hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/80 dark:hover:bg-[#15223F] border border-[#E5E1D8] dark:border-[#1E2D52] transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-[#E5B85C]" /> : <Moon className="h-4 w-4 text-[#173B78]" />}
            </button>

            {/* Login Link */}
            <button onClick={() => openAuth(true)} className="hidden sm:block text-sm font-bold text-[#173B78] hover:text-[#15336B] dark:text-[#ECE9E1] dark:hover:text-[#3F66CC] transition-colors cursor-pointer px-2">
              <T text="Login" />
            </button>

            {/* Sign Up Button */}
            <button onClick={() => openAuth(false)} className="px-5 py-2 rounded-full bg-gradient-to-r from-[#173B78] to-[#3769B5] dark:from-[#3156B5] dark:to-[#3F66CC] text-white text-sm font-bold shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)] transition-all cursor-pointer">
              <T text="Sign Up" />
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="hero-dark-bg absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <span className="hero-glow hero-glow--main"></span>
          <span className="hero-glow hero-glow--navy"></span>
          <span className="hero-glow hero-glow--gold-sm"></span>

          <div className="hero-rings">
            <span className="hero-ring hero-ring--1"></span>
            <span className="hero-ring hero-ring--2"></span>
            <span className="hero-ring hero-ring--3"></span>
            <span className="hero-ring hero-ring--4"></span>
          </div>

          <span className="hero-orbit"><span className="hero-orbit__dot"></span></span>

          <span className="hero-float-circle hero-float-circle--1"></span>
          <span className="hero-float-circle hero-float-circle--2"></span>
          <span className="hero-float-circle hero-float-circle--3"></span>
          <span className="hero-float-circle hero-float-circle--4"></span>
          <span className="hero-float-circle hero-float-circle--5"></span>

          <div className="hero-dust">
            {dustDots.map((dot, i) => (
              <span
                key={i}
                className="hero-dust__dot"
                style={{
                  left: dot.left,
                  top: dot.top,
                  width: dot.size,
                  height: dot.size,
                  animationDuration: dot.duration,
                  animationDelay: dot.delay,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center pt-24 pb-10">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl text-[#18315E] dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            <T text="Connecting Surplus Meals" /><br />
            <span className="hero-gold-shimmer text-transparent bg-clip-text bg-gradient-to-r from-[#18315E] to-[#3769B5] dark:from-[#F2D98D] dark:via-[#D9B65D] dark:to-[#B8923A]">
              <T text="With Local Shelters" />
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-[#60708B] dark:text-slate-300 max-w-2xl italic font-medium" style={{ fontFamily: 'Lora, serif' }}>
            <T text="Join our verified ecosystem of caring restaurants, bakeries, caterers, and active NGOs making zero food waste a daily reality." />
          </p>

          <button onClick={() => openAuth(false)} className="beam-card mt-10 px-8 py-4 rounded-full bg-gradient-to-r from-[#173B78] to-[#3769B5] dark:from-[#3156B5] dark:to-[#3F66CC] text-white text-lg font-bold shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)] transition-transform hover:scale-105 cursor-pointer flex items-center space-x-2">
            <span><T text="Get Started" /></span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 w-full max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-[#18315E] dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            <T text="Features" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map((card, idx) => (
            <div 
              key={idx} 
              className={`beam-card group relative p-8 rounded-[32px] bg-[#FFFFFF] dark:bg-[#0F1A33] backdrop-blur-sm border border-[#E5E1D8] dark:border-[#1E2D52] shadow-sm hover:shadow-card-hover hover:border-[#E5E1D8] dark:hover:border-[#2A426B] transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-105 hover:z-10 h-full w-full flex flex-col items-start text-left`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F3F0EA] dark:bg-[#15223F] flex items-center justify-center mb-6 border border-[#E5E1D8] dark:border-[#1E2D52]/50 group-hover:scale-110 transition-transform duration-300">
                <card.icon className={`w-6 h-6 ${card.color} dark:brightness-125`} />
              </div>
              <h3 className="text-xl font-bold text-[#18315E] dark:text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                <T text={card.title} />
              </h3>
              <p className="text-[#60708B] dark:text-slate-300 italic leading-relaxed text-sm" style={{ fontFamily: 'Lora, serif' }}>
                <T text={card.description} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm font-semibold text-[#60708B] dark:text-slate-300 mt-20 border-t border-[#E5E1D8]/60 dark:border-[#1E2D52]/40">
        <T text="FoodBridge © 2026 · Surplus Food Rescue Network" />
      </footer>

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173B78]/40 dark:bg-[#070E1E]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#0F1A33] p-8 sm:p-9 rounded-[32px] border border-[#E5E1D8]/80 dark:border-[#1E2D52]/40 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-[#60708B] hover:text-[#173B78] dark:text-slate-300 dark:hover:text-[#ECE9E1] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {step === 'FORM' && !isLogin && (
              <button onClick={handleBack} className="text-[#60708B] hover:text-[#173B78] dark:text-slate-300 dark:hover:text-[#ECE9E1] mb-2 flex items-center transition-colors text-xs font-bold cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" /> <T text="Back" />
              </button>
            )}

            {/* Emblem Header */}
            <div className="text-center space-y-2 mt-2 mb-6">
              <Logo size={48} className="mx-auto" />
              <h2 className="text-2xl font-black text-[#18315E] dark:text-white tracking-tight">
                {isLogin ? <T text="Welcome Back" /> : <T text="Create Account" />}
              </h2>
              <p className="text-xs text-[#60708B] dark:text-slate-300 font-medium">
                {isLogin ? <T text="Login to continue." /> : <T text="Join our verified network today." />}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#F3F0EA] dark:bg-[#15223F]/80 p-1 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setStep('FORM'); resetForm(); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  isLogin
                    ? 'bg-gradient-to-r from-[#173B78] to-[#3769B5] dark:from-[#3156B5] dark:to-[#3F66CC] text-white shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)]'
                    : 'text-[#60708B] dark:text-slate-300 hover:text-[#173B78] dark:hover:text-[#ECE9E1]'
                }`}
              >
                <T text="Login" />
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setStep('TYPE_SELECTION'); resetForm(); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  !isLogin
                    ? 'bg-gradient-to-r from-[#173B78] to-[#3769B5] dark:from-[#3156B5] dark:to-[#3F66CC] text-white shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)]'
                    : 'text-[#60708B] dark:text-slate-300 hover:text-[#173B78] dark:hover:text-[#ECE9E1]'
                }`}
              >
                <T text="Sign Up" />
              </button>
            </div>

            {globalError && (
              <div className="bg-[#F3F0EA] dark:bg-[#15223F]/40 text-[#18315E] dark:text-white p-3 rounded-xl text-xs font-bold text-center border border-[#E5E1D8] dark:border-[#1E2D52] mb-4">
                <T text={globalError} fallback={globalError} />
              </div>
            )}

            {step === 'TYPE_SELECTION' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => handleTypeSelection('DONOR')}
                  className="w-full flex items-center justify-center p-4 border-2 border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl hover:border-[#173B78] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/30 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#173B78]/10 text-[#173B78] flex items-center justify-center mr-3 shrink-0">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-[#18315E] dark:text-white block text-xs"><T text="Personal Donor" /></span>
                    <span className="text-[11px] text-[#60708B] dark:text-slate-300"><T text="Individuals, catering, or local restaurants" /></span>
                  </div>
                </button>
                <button
                  onClick={() => handleTypeSelection('ORGANISATION')}
                  className="w-full flex items-center justify-center p-4 border-2 border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl hover:border-[#173B78] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/30 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#173B78]/15 text-[#173B78] dark:text-[#3F66CC] flex items-center justify-center mr-3 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-[#18315E] dark:text-white block text-xs"><T text="NGO / Organisation" /></span>
                    <span className="text-[11px] text-[#60708B] dark:text-slate-300"><T text="Verified community charities & shelters" /></span>
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
                        <span onClick={() => setShowPassword(!showPassword)} className="text-[#60708B] hover:text-[#60708B]">
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
                        <span onClick={() => setShowPassword(!showPassword)} className="text-[#60708B] hover:text-[#60708B]">
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
                        <span onClick={() => setShowPassword(!showPassword)} className="text-[#60708B] hover:text-[#60708B]">
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
                      ? 'bg-[#E5E1D8] dark:bg-[#15223F] text-[#60708B] dark:text-slate-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#173B78] to-[#3769B5] dark:from-[#3156B5] dark:to-[#3F66CC] text-white shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)]'
                  }`}
                >
                  <span>{isSubmitting ? <T text="Processing..." /> : (isLogin ? <T text="Login" /> : <T text="Register" />)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="pt-6 text-center space-y-3">
              <div className="text-[12px] font-extrabold text-[#18315E] dark:text-[#D9B65D] italic flex items-center justify-center space-x-1" style={{ fontFamily: 'Lora, serif' }}>
                <span><T text="Together we feed hope ♥" /></span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default AuthPage;










