import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import {getMessages} from '../api';

export const MessageList = (props) => {
  const { messages } = props;
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[80vh] overflow-y-auto px-4 bg-[#FFFAEA] rounded-lg border border-gray-300">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full w-full">
          <p className="text-5xl text-center w-full font-outfit font-light text-[#574028]">
            How can <span className="font-gloock text-[#EC7C32]">Wally</span> help you?
          </p>
        </div>
      ) : (
        messages.map((msg, messageIndex) => (
          <MessageItem
            key={messageIndex}
            index={messageIndex}
            text={msg.text}
            sender={msg.role}
            image={msg.image}
          />
        ))
      )}
      <div
      le={{ float: 'left', clear: 'both' }} ref={messagesEndRef} />
    </div>
  );

};

export default MessageList;
