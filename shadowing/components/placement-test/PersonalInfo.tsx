import React, { useState } from "react";
import Image from "next/image";

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  target: string;
}

interface PersonalInfoProps {
  personalInfo: PersonalInfo;
  onInfoChange: (
    field: keyof PersonalInfo
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onStartTest: () => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({
  personalInfo,
  onInfoChange,
  onStartTest,
}) => {
  const [errors, setErrors] = useState<Partial<PersonalInfo>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof PersonalInfo | null>(null);

  const validateForm = () => {
    const newErrors: Partial<PersonalInfo> = {};
    
    if (!personalInfo.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!personalInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(personalInfo.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!personalInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(personalInfo.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!personalInfo.target) {
      newErrors.target = "Please select a target score";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartTest = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onStartTest();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#232323] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-8 relative">
          <Image 
            src="/logo1.png" 
            alt="Logo" 
            fill
            style={{ objectFit: 'contain' }}
            priority 
            className="drop-shadow-2xl"
          />
        </div>

        {/* Card */}
        <div className="bg-[#2b2b2b] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#fc5d01] to-[#ff7e3f] px-8 py-6">
            <h2 className="text-3xl font-bold text-white text-center">
              Personal Information
            </h2>
            <p className="text-white/80 text-center mt-2">
              Please fill in your details to start the test
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Full Name Input */}
            <div className="relative">
              <input
                type="text"
                id="fullName"
                value={personalInfo.fullName}
                onChange={(e) => {
                  onInfoChange("fullName")(e);
                  if (errors.fullName) setErrors({ ...errors, fullName: "" });
                }}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
                className={`peer w-full bg-[#3c4049] text-white px-4 py-3 rounded-lg outline-none transition-all
                  ${errors.fullName ? 'border-2 border-red-500' : focusedField === "fullName" ? 'ring-2 ring-[#fc5d01]' : ''}`}
              />
              <label
                htmlFor="fullName"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${personalInfo.fullName || focusedField === "fullName"
                    ? '-top-2.5 text-sm bg-[#2b2b2b] px-2'
                    : 'top-3 text-gray-400'}
                  peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-[#2b2b2b] peer-focus:px-2
                  ${focusedField === "fullName" ? 'text-[#fc5d01]' : 'text-gray-400'}
                `}
              >
                Full Name
              </label>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                id="email"
                value={personalInfo.email}
                onChange={(e) => {
                  onInfoChange("email")(e);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
                className={`peer w-full bg-[#3c4049] text-white px-4 py-3 rounded-lg outline-none transition-all
                  ${errors.email ? 'border-2 border-red-500' : focusedField === "email" ? 'ring-2 ring-[#fc5d01]' : ''}`}
              />
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${personalInfo.email || focusedField === "email"
                    ? '-top-2.5 text-sm bg-[#2b2b2b] px-2'
                    : 'top-3 text-gray-400'}
                  peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-[#2b2b2b] peer-focus:px-2
                  ${focusedField === "email" ? 'text-[#fc5d01]' : 'text-gray-400'}
                `}
              >
                Email Address
              </label>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone Input */}
            <div className="relative">
              <input
                type="tel"
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => {
                  onInfoChange("phone")(e);
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
                className={`peer w-full bg-[#3c4049] text-white px-4 py-3 rounded-lg outline-none transition-all
                  ${errors.phone ? 'border-2 border-red-500' : focusedField === "phone" ? 'ring-2 ring-[#fc5d01]' : ''}`}
              />
              <label
                htmlFor="phone"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${personalInfo.phone || focusedField === "phone"
                    ? '-top-2.5 text-sm bg-[#2b2b2b] px-2'
                    : 'top-3 text-gray-400'}
                  peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-[#2b2b2b] peer-focus:px-2
                  ${focusedField === "phone" ? 'text-[#fc5d01]' : 'text-gray-400'}
                `}
              >
                Phone Number
              </label>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Target Score Select */}
            <div className="relative">
              <select
                id="target"
                value={personalInfo.target}
                onChange={(e) => {
                  onInfoChange("target")(e);
                  if (errors.target) setErrors({ ...errors, target: "" });
                }}
                onFocus={() => setFocusedField("target")}
                onBlur={() => setFocusedField(null)}
                className={`peer w-full bg-[#3c4049] text-white px-4 py-3 rounded-lg outline-none transition-all appearance-none
                  ${errors.target ? 'border-2 border-red-500' : focusedField === "target" ? 'ring-2 ring-[#fc5d01]' : ''}
                  ${!personalInfo.target && 'text-gray-400'}`}
              >
                <option className="text-gray-400" value="">Target Score</option>
                <option value="30">30</option>
                <option value="36">36</option>
                <option value="42">42</option>
                <option value="50">50</option>
                <option value="58">58</option>
                <option value="65">65</option>
                <option value="79">79</option>
              </select>
              <label
                htmlFor="target"
                className={`absolute left-4 transition-all duration-200 pointer-events-none
                  ${personalInfo.target || focusedField === "target"
                    ? '-top-2.5 text-sm bg-[#2b2b2b] px-2'
                    : 'top-3 text-gray-400'}
                  peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-[#2b2b2b] peer-focus:px-2
                  ${focusedField === "target" ? 'text-[#fc5d01]' : 'text-gray-400'}
                `}
              >
                Target Score
              </label>
              <div className="absolute right-4 top-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {errors.target && (
                <p className="mt-1 text-sm text-red-500">{errors.target}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleStartTest}
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-[#fc5d01] to-[#ff7e3f] text-white py-4 rounded-lg text-lg font-semibold mt-8
                transform transition-all duration-200
                ${isSubmitting 
                  ? 'opacity-75 cursor-not-allowed' 
                  : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Start Test'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
