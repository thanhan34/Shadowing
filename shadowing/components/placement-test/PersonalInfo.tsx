import React from "react";

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

const PersonalInfoForm: React.FC<PersonalInfoProps> = ({
  personalInfo,
  onInfoChange,
  onStartTest,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-6 bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-[#fc5d01] mb-6">
          Personal Information
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={personalInfo.fullName}
              onChange={onInfoChange("fullName")}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={personalInfo.email}
              onChange={onInfoChange("email")}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-300"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={personalInfo.phone}
              onChange={onInfoChange("phone")}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
              required
            />
          </div>

          <div>
            <label
              htmlFor="target"
              className="block text-sm font-medium text-gray-300"
            >
              Target Score
            </label>
            <select
              id="target"
              value={personalInfo.target}
              onChange={onInfoChange("target")}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
              required
            >
              <option value="">Select target score</option>
              <option value="30">30</option>
              <option value="36">36</option>
              <option value="42">42</option>
              <option value="50">50</option>
              <option value="58">58</option>
              <option value="65">65</option>
              <option value="79">79</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onStartTest}
            className="w-full px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#ff6a28] transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg"
          >
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
