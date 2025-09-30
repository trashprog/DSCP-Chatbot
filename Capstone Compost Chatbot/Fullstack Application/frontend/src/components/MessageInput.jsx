import {streamAnswer, generateTopic, createSession, createMessage, terminateStream} from '../api'
import { useRef, useState, useEffect } from 'react';
// import { flushSync } from 'react-dom';
import {ImagePreview} from './ImagePreview';

export const MessageInput = (props) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const {messages, setMessages, currentTopic, setCurrentTopic, sessions, setSessions, user} = props; 
  const [imageFile, setImageFile] = useState(null); // For uploading the image file
  const [streamedText, setStreamedText] = useState(null);


  async function generateStreamedTopic(assistantReply) {
    try {
      let topic = await generateTopic(assistantReply);
      const reader = topic.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullTopic = '';
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const text = decoder.decode(value, { stream: true });
                fullTopic += text;
                setSessions(prevSessions => {
                  const updatedSessions = [...prevSessions];
                  const lastIndex = updatedSessions.length - 1;
                  const current = updatedSessions[lastIndex];
                  updatedSessions[lastIndex] = {
                    ...current,
                    sessiontopic: current.sessiontopic === 'New chat' ? text : current.sessiontopic + text
                  };
                  return updatedSessions;
                });
            }
        }
        return fullTopic;
    } catch (error) {
      console.error("Error generating/updating topic:", error);
    }
  }

  // this is for generating the topic in the side bar
  async function fetchStreamedText(query, sessionid, imageUrl) {
    // Set streaming to true BEFORE the request to update the UI immediately
    setIsStreaming(true);
    let fullText='';
    
    try {
        let response = await streamAnswer(query, sessionid, imageUrl);

        // Capture the unique stream ID from the response headers
        const streamId = response.headers.get('X-Stream-ID');
        if (streamId) {
            setCurrentStreamId(streamId);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const text = decoder.decode(value, { stream: true });
                fullText+= text;
                setMessages(prevMessages => {
                  const updatedMessages = [...prevMessages];
                  const lastIndex = updatedMessages.length - 1;
                  updatedMessages[lastIndex] = {
                    ...updatedMessages[lastIndex],
                    text: updatedMessages[lastIndex].text + text
                  };
                  return updatedMessages;
                });
            }
        }
        setStreamedText(fullText);
        return fullText;
    } catch (error) {
        // Handle fetch errors (e.g., network issue, user cancelled)
        if (error.name !== 'AbortError') {
            console.error("Error fetching streamed text:", error);
        }
    } finally {
        // CRITICAL: This block runs whether the stream finishes, fails, or is terminated.
        // It ensures the UI state is always reset correctly.
        setIsStreaming(false);
        setCurrentStreamId(null);
    }
  };

  const handleKeyDown = (e) => {
    // Check if the pressed key is 'Enter' and the Shift key is NOT held down.
    // This allows Shift+Enter for new lines in a textarea (good practice).
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent the default 'Enter' behavior (like adding a new line).
      e.preventDefault();
      // Manually call the handleSubmit function.
      handleSubmit(e);
    }
  };
  
    // massive logic error here, i think you can add one more line to update the sessions table cus its retrieving the auto generated seseeion id with the massive number
  async function handleSubmit(e) {
        e.preventDefault();

        // Preserve the current values in local constants
        const currentPrompt = prompt.trim();
        const currentImage = previewImage;
        const currentImageFile = imageFile;

        // Guard clause: if nothing is sent, exit.
        if (!currentPrompt && !currentImage) return;
        
        // Now, clear the input fields in the UI
        setPrompt('');
        setPreviewImage(null);
        setImageFile(null);

        let sessionid = currentTopic?.sessionid;

        const userMessage = {
          role: 'user',
          text: currentPrompt,
          image: currentImage
        };

        // Optimistically update the UI with the user's message and a loading placeholder
        const newMessages = [...messages, userMessage, { role: 'assistant', text: '' }];
        setMessages(newMessages);

        // Handle new chat/session creation
        if (!sessionid) {
          // Use currentPrompt for topic generation
          const topic = await generateStreamedTopic(currentPrompt);
          const sessionResponse = await createSession(user.username, topic);
          sessionid = sessionResponse.session.sessionid;
          setCurrentTopic(sessionResponse.session);

          const updatedSessions = [
            ...sessions.slice(0, sessions.length - 1),
            sessionResponse.session
          ];
          setSessions(updatedSessions);
        }

        // Insert user's message into the database using the preserved prompt
        const userResponse = await createMessage({ sessionid: sessionid, sender: 'user', content: currentPrompt, imageFile: currentImageFile});
        const userMessageId = userResponse.messageid;

        // Fetch the streamed response from the AI using the preserved prompt
        const fullText = await fetchStreamedText(currentPrompt, sessionid, userResponse.image);

        // After the full response is generated, save it to the database
        if (fullText) {
        await createMessage({ sessionid, sender: 'assistant', content: fullText, reply_to: userMessageId });
        }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click()
    };

    const handleStopStreaming = async () => {
    if (currentStreamId) {
      await terminateStream(currentStreamId);
      // The `finally` block in `fetchStreamedText` will automatically handle resetting the UI state.
    }
  };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file); // Store the actual File object for upload
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result); // Store the data URL for preview
        };
        reader.readAsDataURL(file);
        fileInputRef.current.value = null; // Reset input for same-file selection
      }
    };
  
    const clearImage = () => {
        setPreviewImage(null);
        setImageFile(null);
    }

  return (
    <form
      className="flex flex-col items-center gap-2 p-6 rounded-2xl shadow-lg w-full max-w-5xl mx-auto"
      // onSubmit={handleSubmit}
    >
      {previewImage && (
        <ImagePreview imageUrl={previewImage} onDelete={clearImage} />
      )}
      
      <div className="flex items-center justify-center gap-4 w-full">
        <button 
          type="button" 
          onClick={triggerFileInput}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#574028] hover:bg-[#4e3c28] text-white transition duration-200"
          title="Upload Image"
        >
          <i className="fa-solid fa-paperclip text-lg"></i>
        </button>

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }} // This hides it from view
          accept="image/*"
        />

        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type your message..."
          onKeyDown={handleKeyDown}
          className="text-sm text-lg px-6 py-3 bg-white rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={handleStopStreaming}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
            title="Stop Generating"
          >
            <i className="fa-solid fa-stop text-lg"></i>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#574028] hover:bg-[#4e3c28] text-white transition-all duration-200"
            title="Send Message"
          >
            <i className="fa-solid fa-arrow-up text-lg"></i>
          </button>
        )}

      </div>
    </form>
  );
}

export default MessageInput;


    
