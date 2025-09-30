import React, { useEffect, useRef } from 'react';
import {ChatSession} from './ChatSession';
import {deleteSession, editSessionTopic, deleteSessionMemory} from '../api';

export const ChatSessions = (props) => {

    const {sessions, setSessions, loading, error, fetchSessions, handleNewSession, currentTopic, setCurrentTopic, setMessages, user} = props;

    async function handleDelete(seshid){
      await deleteSessionMemory(seshid);
      await deleteSession(seshid);
      setCurrentTopic(null);
      fetchSessions();
    }
    async function handleEdit(seshid, newTopic){
      await editSessionTopic(seshid, newTopic);
      fetchSessions();
    }

    return (
    <div className="h-full">
      <div className="overflow-y-auto max-h-[70vh] p-2 space-y-2">
        {sessions
        .filter(session => session.sessiontopic !== 'New chat') // filter out 'New Chat'
        .map((session) => (
          // passing fetchSessions to here
          <ChatSession sessions={sessions} user={user} setSessions={setSessions} handleEdit={handleEdit} setMessages={setMessages} currentTopic={currentTopic} setCurrentTopic={setCurrentTopic} key={session.sessionid} session={session} onDelete={handleDelete}/>
        ))}
      </div>
    </div>
  );
}