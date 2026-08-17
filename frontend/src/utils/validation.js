export const validatePhoneNumber = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!/^\d+$/.test(phone)) return 'Phone number must contain only digits';
  if (phone.length !== 10) return 'Phone number must be exactly 10 digits';
  return '';
};

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return 'Invalid email ID';
  return '';
};

export const validatePincode = (pincode) => {
  if (!pincode) return 'Pincode is required';
  if (!/^\d+$/.test(pincode)) return 'Pincode must contain only digits';
  if (pincode.length !== 6) return 'Pincode must be exactly 6 digits';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateName = (name) => {
  if (!name) return 'Full Name is required';
  if (/[^a-zA-Z\s]/.test(name)) return 'Name must not contain special characters or numbers';
  return '';
};
