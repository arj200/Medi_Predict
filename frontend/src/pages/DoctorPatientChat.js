import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatMessages, uploadChatFile, startVideoCall } from '../services/api';
import io from 'socket.io-client';

const DoctorPatientChat = ({ consultation, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize socket connection for real-time chat
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      if (consultation.chat_room_id) {
        newSocket.emit('join_chat_room', { room_id: consultation.chat_room_id });
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('user_typing', (data) => {
      if (data.user_id !== user.id) {
        setTypingUsers(prev => 
          data.typing 
            ? [...prev.filter(u => u.user_id !== data.user_id), data]
            : prev.filter(u => u.user_id !== data.user_id)
        );
      }
    });

    newSocket.on('user_joined', (data) => {
      setOnlineUsers(prev => [...prev, data.user_id]);
    });

    setSocket(newSocket);
    loadChatMessages();

    return () => {
      if (consultation.chat_room_id) {
        newSocket.emit('leave_chat_room', { room_id: consultation.chat_room_id });
      }
      newSocket.disconnect();
    };
  }, [consultation.chat_room_id, user.id]);

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      if (consultation.chat_room_id) {
        const response = await getChatMessages(consultation.chat_room_id);
        if (response.success) {
          setMessages(response.messages);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !consultation.chat_room_id) return;

    try {
      const response = await sendMessage(
        consultation.chat_room_id,
        newMessage.trim(),
        'text'
      );

      if (response.success) {
        setNewMessage('');
        handleTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !consultation.chat_room_id) return;

    try {
      const uploadResponse = await uploadChatFile(file, consultation.chat_room_id);
      
      if (uploadResponse.success) {
        await sendMessage(
          consultation.chat_room_id,
          `📎 Medical document: ${uploadResponse.filename}`,
          'file',
          uploadResponse.file_url
        );
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleStartVideoCall = async () => {
    try {
      const response = await startVideoCall(
        consultation.id,
        consultation.chat_room_id,
        'video'
      );
      
      if (response.success) {
        window.open(
          `/video-call/${response.call_id}`,
          '_blank',
          'width=800,height=600'
        );
      }
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    if (socket && consultation.chat_room_id) {
      socket.emit('typing', {
        room_id: consultation.chat_room_id,
        typing: typing
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageBubbleClass = (senderId) => {
    return senderId === user.id
      ? 'bg-blue-500 text-white ml-auto'
      : 'bg-gray-200 text-gray-800 mr-auto';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Loading patient chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation.chat_room_id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <span className="text-4xl">⚠️</span>
            <p className="mt-2">Chat room not available for this consultation.</p>
            <button
              onClick={onClose}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 h-5/6 flex flex-col">
        {/* Doctor Chat Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              👤
            </div>
            <div>
              <h3 className="font-semibold">
                Patient: {consultation.patient_name || 'Unknown Patient'}
              </h3>
              <p className="text-sm text-blue-200">
                {onlineUsers.length > 1 ? '🟢 Online' : '🔴 Offline'}
              </p>
              <p className="text-xs text-blue-300">
                Consultation: {new Date(consultation.requested_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartVideoCall}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
              title="Start Video Consultation"
            >
              📹
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full"
              title="Share Medical Document"
            >
              📎
            </button>
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Welcome Message for Doctors */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💬 Secure patient communication channel • HIPAA Compliant
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Patient Email: {consultation.patient_email}
            </p>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                {message.sender_id !== user.id && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                    👤
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-lg ${getMessageBubbleClass(message.sender_id)}`}
                >
                  {message.message_type === 'file' && (
                    <div className="mb-2">
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-200 hover:text-blue-100"
                      >
                        📄 View Medical Document
                      </a>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
                {message.sender_id === user.id && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white">
                    Dr
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                <p className="text-sm italic">
                  Patient is typing...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Doctor Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onBlur={() => handleTyping(false)}
              placeholder="Type your medical advice or response..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send 📤
            </button>
          </div>
          
          {/* Doctor Quick Response Templates */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNewMessage("Thank you for sharing your symptoms. Let me review them.")}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              📋 Review Symptoms
            </button>
            <button
              type="button"
              onClick={() => setNewMessage("I recommend scheduling a follow-up appointment.")}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              📅 Follow-up
            </button>
            <button
              type="button"
              onClick={() => setNewMessage("Please take the prescribed medication as directed.")}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              💊 Prescription
            </button>
          </div>
        </form>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        />
      </div>
    </div>
  );
};

export default DoctorPatientChat;
