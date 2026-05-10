import { useEffect, useRef, useState } from 'react';
import { Send, Loader } from 'lucide-react';
import socketService, { Message, TypingUser } from '../services/socketService';
import axios from 'axios';

interface ChatProps {
  groupId: number;
  currentUserId: number;
  currentUserRole: string;
  onClose?: () => void;
}

export default function ChatComponent({
  groupId,
  currentUserId,
  currentUserRole,
  onClose,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and group details
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch messages
        const messagesResponse = await axios.get(
          `/api/comms/messages/group/${groupId}?page=1&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(messagesResponse.data.data.messages);

        // Fetch group details
        const groupResponse = await axios.get(`/api/comms/group/${groupId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroupMembers(groupResponse.data.data.members);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load chat data:', error);
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [groupId]);

  // Initialize socket and subscribe to events
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // Join group
    socketService.joinGroup(groupId);

    // Subscribe to new messages
    const unsubscribeMessage = socketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Subscribe to typing indicators
    const unsubscribeTyping = socketService.onTyping((typingUserList) => {
      setTypingUsers(typingUserList);
    });

    // Subscribe to user joined
    const unsubscribeJoined = socketService.onUserJoined((data) => {
      console.log(`${data.userName} joined the chat`);
    });

    // Subscribe to user left
    const unsubscribeLeft = socketService.onUserLeft((data) => {
      console.log(`${data.userName} left the chat`);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeJoined();
      unsubscribeLeft();
      socketService.leaveGroup(groupId);
    };
  }, [groupId]);

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Start typing indicator
    if (!isTypingRef.current && e.target.value.length > 0) {
      isTypingRef.current = true;
      socketService.startTyping(groupId);
    }

    // Stop typing with debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.stopTyping(groupId);
      }
    }, 3000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      setIsSending(true);
      socketService.sendMessage(groupId, inputValue.trim());
      setInputValue('');
      isTypingRef.current = false;
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Send on Enter (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Group Chat</h2>
          <p className="text-sm opacity-90">{groupMembers.length} members</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_id === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.sender_id !== currentUserId && (
                  <p className="text-xs font-semibold opacity-70 mb-1">{msg.sender_name}</p>
                )}
                <p className="break-words">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
            <span>
              {typingUsers.map((u) => u.userName).join(', ')} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center"
          >
            {isSending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
