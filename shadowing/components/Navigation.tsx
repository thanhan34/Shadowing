import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from 'react-feather'; // If you're using react-feather for icons

const Navigation: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white bg-opacity-30 backdrop-blur-lg p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior>
          <a className="text-black text-lg font-semibold">Home</a>
        </Link>
        <div className="hidden md:flex space-x-4 items-center">
          <Link href="/writefromdictation" legacyBehavior>
            <a className="text-black hover:underline">Write From Dictation</a>
          </Link>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-black hover:underline focus:outline-none"
            >
              Useful Links
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-30 backdrop-blur-lg rounded-md shadow-lg py-2 z-20">
                <Link href="https://www.youtube.com/channel/UCG-3Z9RIe330EbUBNb8weZw" legacyBehavior>
                  <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                    YouTube Channel
                  </a>
                </Link>
                <Link href="https://www.facebook.com/groups/pteintensive" legacyBehavior>
                  <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                    Facebook Group
                  </a>
                </Link>
                <Link href="https://www.facebook.com/pteintensive" legacyBehavior>
                  <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                    Facebook Fanpage SBS PTE Intensive
                  </a>
                </Link>
                <Link href="https://www.facebook.com/pteintensivesupport" legacyBehavior>
                  <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                    Facebook Fanpage SBS PTE Intensive - Hỗ trợ tư vấn
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white focus:outline-none">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden">
          <Link href="/writefromdictation" legacyBehavior>
            <a className="block text-black py-2 px-4 hover:underline">Write From Dictation</a>
          </Link>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="block w-full text-left text-black py-2 px-4 hover:underline focus:outline-none"
          >
            Useful Links
          </button>
          {dropdownOpen && (
            <div className="mt-2 w-full bg-white bg-opacity-30 backdrop-blur-lg rounded-md shadow-lg py-2 z-20">
              <Link href="https://www.youtube.com/channel/UCG-3Z9RIe330EbUBNb8weZw" legacyBehavior>
                <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                  YouTube Channel
                </a>
              </Link>
              <Link href="https://www.facebook.com/groups/pteintensive" legacyBehavior>
                <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                  Facebook Group
                </a>
              </Link>
              <Link href="https://www.facebook.com/pteintensive" legacyBehavior>
                <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                  Facebook Fanpage SBS PTE Intensive
                </a>
              </Link>
              <Link href="https://www.facebook.com/pteintensivesupport" legacyBehavior>
                <a target="_blank" className="block px-4 py-2 text-gray-800 hover:bg-gray-200">
                  Facebook Fanpage SBS PTE Intensive - Hỗ trợ tư vấn
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
