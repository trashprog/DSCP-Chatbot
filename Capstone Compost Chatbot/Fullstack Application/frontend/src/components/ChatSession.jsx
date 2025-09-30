import React, { useEffect, useRef, useState} from 'react';
import {getMessages, getSessions} from '../api';
import { reloadMemory } from '../api';



export const ChatSession = (props) => {

  const inputRef = useRef(null);

  const { currentTopic, setCurrentTopic, session, onDelete, setMessages, handleEdit, setSessions, user, sessions} = props;
  const isActive = currentTopic?.sessionid === session.sessionid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState(session.sessiontopic);

  useEffect(() => {
  if (isEditing && inputRef.current) {
    inputRef.current.select();
  }
  }, [isEditing]);

  // this async function will check if you are not saving an empty space, and if the topic is different, if yes proceed on to update the session topic
  async function handleSave(){
    if (editedTopic.trim() && editedTopic !== session.sessiontopic) {
      await handleEdit(session.sessionid, editedTopic);
    }
    setIsEditing(false);
  }

  return (
    <button
      type="button"
      onClick={async () => {
        setCurrentTopic(session);

        // this part handles the case when a new chat is clicked and u dont wanna make new chat so you just clikc another existing chat
        const data = await getSessions(user.username);
        setSessions(data);

        const msgs = await getMessages(session.sessionid);
        setMessages(msgs);
        console.log(sessions);
      }}
      className={`w-full text-left p-2 rounded cursor-pointer flex items-center justify-between appearance-none 
      transition-colors duration-100 ease-in-out text-sm
      ${isActive ? 'bg-[#6D8B4B]' : 'bg-[#6D8B4B]/70'}`}
    >
      <div className="flex-1 pr-4">
        {isEditing ? (
          <input autoFocus type="text" value={editedTopic} ref={inputRef}
            onChange={(e) => setEditedTopic(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                setEditedTopic(session.sessiontopic);
                setIsEditing(false);
              }
            }}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        ) : (
          <>
            <p className="font-outfit text-white">{session.sessiontopic}</p>
            <p className="text-xs font-outfit text-white">
              {new Date(session.datecreated).toLocaleString()}
            </p>
          </>
        )}
      </div>

      {/* edit n delete icons */}
      <div className="flex items-center gap-3 ml-2">
        <span
          title="Edit session"
          className="text-white/70 hover:text-white cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <i className="fa-solid fa-pen"></i>
        </span>

        <span
          className="text-white/70 hover:text-white cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.sessionid);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onDelete(session.sessionid);
            }
          }}
          title="Delete session"
        >
          <i className="fa-solid fa-trash"></i>
        </span>
      </div>
    </button>
  );
};
