import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageInput from '../components/MessageInput';
import MessageList from '../components/MessageList';
import SideBarModal from '../components/SideBarModal';
import { FaBars, FaArrowLeft, FaCog } from 'react-icons/fa';
import {reloadMemory} from '../api';

function Chatbot() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load user session on mount
 useEffect(() => {
  const token = sessionStorage.getItem('token');
  const user = sessionStorage.getItem('user');

  const init = async () => {
    if (token && user) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const parsedUser = JSON.parse(user);
      setLoggedInUser(parsedUser);

      try {
        await reloadMemory(parsedUser.userid);  // 🔁 Ensures memory is ready
      } catch (err) {
        console.error('Error reloading memory:', err);
      }

    } else {
      navigate('/'); // Not logged in? Redirect to login
    }
  };

  init();
}, [navigate]);

  

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setLoggedInUser(null);
    setMessages([]);
    navigate('/');
  };

  if (!loggedInUser) return null; // Prevent flicker

  return (
    <div
      className="h-screen w-full bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* TOP NAVBAR */}
      <div className="bg-[#6D8B4B] py-2 px-6 flex items-center justify-between shadow-md w-full h-20 relative">
        {/* Left: Hamburger */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-[#EC7C32] text-white p-2 rounded-full hover:opacity-90"
          >
            <FaBars size={22} />
          </button>
        )}

        {/* Center: Logo and Title */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
          <img
            src="/logo_beige.png"
            alt="Wally the Worm Logo"
            className="w-15 h-15 object-contain"
          />
          <h1 className="text-3xl font-gloock text-[#FFFAEA] drop-shadow-md">
            Wally the Worm
          </h1>
        </div>

        {/* Right: Back + Settings */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Welcome Page button */}
          <button
            onClick={() => navigate('/Welcome')}
            className="bg-[#574028] text-[#FFFAEA] hover:bg-[#46321f] flex items-center gap-1 font-semibold text-sm sm:text-base px-3 py-2 rounded-lg"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Back to Welcome</span>
          </button>

          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className="text-[#FFFAEA] hover:text-white p-2"
            >
              <FaCog size={20} />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 bg-white text-sm rounded shadow-md z-50 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 w-full text-left hover:bg-gray-100 text-red-600"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* MAIN CONTENT */}
      <div className="w-full flex items-start justify-center p-4 gap-4">
        <SideBarModal
          user={loggedInUser}
          handleLogout={handleLogout}
          setMessages={setMessages}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          sessions={sessions}
          setSessions={setSessions}
          currentTopic={currentTopic}
          setCurrentTopic={setCurrentTopic}
        />

        <div
          className={`transition-all duration-300 ${
            isOpen ? 'translate-x-50' : 'translate-x-0'
          } w-full flex-1 flex flex-col items-center justify-start p-4`}
        >
          <div className="w-full max-w-4xl h-[80vh] flex flex-col border bg-[#6D8B4B]  rounded-lg shadow-md">
            <MessageList messages={messages} />
            <MessageInput
              user={loggedInUser}
              setMessages={setMessages}
              messages={messages}
              currentTopic={currentTopic}
              setCurrentTopic={setCurrentTopic}
              sessions={sessions}
              setSessions={setSessions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


export default Chatbot;
