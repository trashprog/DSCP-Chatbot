// SidebarModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {ChatSessions} from './ChatSessions';
import {useState, useEffect} from 'react';
import {getMessages, getSessions} from '../api';


  const SidebarModal = (props) => {

  const { user, handleLogout, isOpen, setIsOpen, setMessages, sessions, setSessions, currentTopic, setCurrentTopic} = props
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  function handleNewSession(){

    // If "New chat" already exists, do nothing
    const alreadyExists = sessions.some(
      (s) => s.sessiontopic === "New chat"
    );
    if (alreadyExists) return;

    setMessages([]);
    const tempSession = {
      sessionid: Date.now(),
      sessiontopic: "New chat",
      datecreated: new Date().toISOString()
    };
    const newSessions = [...sessions, tempSession];
    setSessions(newSessions);
    setCurrentTopic(null);
    console.log(newSessions);
  }

  // gets all sessions and creates a new chat in the process if there is none
  async function fetchSessions(){
      try {
        setLoading(true);
        const data = await getSessions(user.username);
        setSessions(data);

        // set current topic to the first if there is some data
        if (data.length > 0) {
            const currenttopic = data[0];
            setCurrentTopic(currenttopic);
            const msgs = await getMessages(currenttopic.sessionid);
            setMessages(msgs);
        }

        // First, set the sessions
        // setSessions(() => {
        //   // If no sessions or last isn't 'New chat', add one
        //   if (
        //     data.length === 0 ||
        //     data[data.length - 1].sessiontopic !== "New chat"
        //   ) {
        //     const newTempSession = {
        //       sessionid: Date.now(),
        //       sessiontopic: "New chat",
        //       datecreated: new Date().toISOString()
        //     };
        //     return [...data, newTempSession];
        //   }
        //   return data;
        // });


      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError('Failed to load sessions.');
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {

    if (user?.username) {
      fetchSessions();
      // handleNewSession();
      console.log(sessions)
    }
  }, [user]);



  return (
    <>
      <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 h-full w-90 bg-[#FFFAEA] gap-3 shadow-lg flex flex-col gap-4 z-50"
    >
      <div className="bg-[#574028] w-full text-white px-6 py-5 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-outfit leading-snug">Hey, {user.username}</h2>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className="hover:text-white/70 text-2xl"
        >
          ✕
        </button>
      </div>

      <p className="text-sm leading-relaxed">{user.role} role</p>

      <button
        onClick={handleNewSession}
        disabled={
          sessions.length > 0 &&
          sessions[sessions.length - 1].sessiontopic === 'New chat'
        }
        className={`w-full px-4 py-3 rounded-xl text-sm transition duration-200 font-outfit
          ${
            sessions.length > 0 &&
            sessions[sessions.length - 1].sessiontopic === 'New chat'
              ? 'bg-gray-400 text-white border-2 border-[#415925] cursor-not-allowed'
              : 'bg-white text-[#415925] border-2 border-[#415925] hover:bg-[#C0D9A3]'
          }`}
      >
        + New Chat
      </button>
    </div>


      {/* "Chats" Label */}
      <h3 className="text-[#574028] font-bold text-md -mt-1 pl-5">Chats</h3>

      {/* ChatSessions */}
      <ChatSessions
        user={user}
        setSessions={setSessions}
        sessions={sessions}
        loading={loading}
        error={error}
        fetchSessions={fetchSessions}
        handleNewSession={handleNewSession}
        currentTopic={currentTopic}
        setCurrentTopic={setCurrentTopic}
        setMessages={setMessages}
      />
    </motion.div>

    </>
  );

};

export default SidebarModal;
