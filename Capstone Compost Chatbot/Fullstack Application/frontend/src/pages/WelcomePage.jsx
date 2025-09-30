import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';

const WelcomePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center bg-cover bg-center"
      style={{ backgroundImage: `url('/background.jpg')` }}
    >
      {/* TOP NAV BAR */}
      <div className="bg-[#6D8B4B] py-2 px-6 flex items-center justify-between shadow-md w-full h-20 relative">
        {/* Settings icon on the left */}
        <div className="relative">
          <FiSettings
            className="text-white text-3xl cursor-pointer"
            onClick={() => setShowSettings(prev => !prev)}
          />
          {showSettings && (
            <div className="absolute top-10 left-0 bg-white text-[#574028] shadow-md rounded-md py-2 w-32 z-10">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-[#eee]"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Center content */}
        <div className="flex items-center">
          <img
            src="/logo_beige.png"
            alt="ComBoss Logo"
            className="w-15 h-15 object-contain"
          />
          <h1 className="text-white text-2xl sm:text-3xl font-gloock font-bold tracking-wide">ComBoss</h1>
        </div>

        {/* Empty spacer to balance */}
        <div style={{ width: '24px' }}></div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-[#FFFAEA] rounded-3xl shadow-2xl w-full max-w-6xl p-10 flex flex-col justify-between h-[75vh] backdrop-blur-sm mt-8">
        {/* TOP Section */}
        <div className="flex flex-col items-center gap-3 flex-grow">
          <h1 className="text-5xl sm:text-7xl font-gloock text-[#627151]">
            Welcome, <span className="text-[#574028] font-gloock">{user?.username || 'Guest'}</span>!
          </h1>
          <h2 className="text-xl sm:text-2xl text-[#574028] font-medium">
            Your role is: <span className="italic">{user?.role || 'N/A'}</span>
          </h2>
          <p className="text-[#574028] text-lg text-center max-w-xl">
            Explore your personalized dashboard and chat with your AI compost assistant, all in one place!
          </p>
        </div>
         {/* BOTTOM Section */}
        <div className="flex gap-10 justify-center mt-4">
        {/* Chatbot Button */}
          <button
            onClick={() => navigate('/chat')}
            className="transition-transform hover:scale-105 text-[#FFFAEA] text-4xl font-gloock border-4 border-[#574028] rounded-3xl px-10 py-5 bg-cover bg-center font-semibold flex flex-col justify-center items-center text-center"
            style={{
                backgroundImage: `url('/background.jpg')`,
                width: '400px',   // ~w-100
                height: '200px'   // ~h-50
            }}
          >
            Wally the Worm
            <span className="text-base font-normal mt-1">Your chatbot assistant</span>
          </button>
          
          {/* Dashboard Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="transition-transform hover:scale-105 text-[#FFFAEA] text-4xl font-gloock border-4 border-[#574028] rounded-3xl px-10 py-5 bg-cover bg-center font-semibold flex flex-col justify-center items-center text-center"
            style={{
                backgroundImage: `url('/background.jpg')`,
                width: '400px',   // ~w-100
                height: '200px'   // ~h-50
            }}
          >
            Dashboard
            <span className="text-base font-normal mt-1">Track EC, Moisture & More</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;