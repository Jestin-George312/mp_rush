import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import { fetchProjects } from '../../services/projectApi';
import { fetchMessages, sendMessage } from '../../services/commsApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    text: string;
    sender: 'student' | 'guide';
    timestamp: Date;
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [groupId, setGroupId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial load: determine active project group to fetch messages
    useEffect(() => {
        fetchProjects()
            .then(res => {
                const project = res.data?.[0];
                if (project && project.group_id) {
                    setGroupId(project.group_id);
                }
            }).catch(console.error);
    }, []);

    // Polling or Fetching messages loop!
    useEffect(() => {
        if (!groupId) return;
        const loadDocs = () => {
             fetchMessages(groupId).then(res => {
                 const mapped = res.data.map((m: any) => ({
                     id: String(m.id),
                     text: m.text,
                     sender: m.sender_role,
                     timestamp: new Date(m.created_at)
                 }));
                 setMessages(mapped.reverse()); // Reverse if database returns ASC/DESC inverse
             }).catch(console.error);
        };
        loadDocs();
        const interval = setInterval(loadDocs, 3000); // Poll every 3 seconds for updates
        return () => clearInterval(interval);
    }, [groupId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || !groupId) {
             if(!groupId) toast.error("No active project found to chat under.");
             return;
        }

        const inputData = inputValue;
        setInputValue(''); // Optimistic cleared
        try {
            await sendMessage(groupId, inputData);
            // Refresh instantly
            fetchMessages(groupId).then(res => {
                 const mapped = res.data.map((m: any) => ({
                     id: String(m.id),
                     text: m.text,
                     sender: m.sender_role,
                     timestamp: new Date(m.created_at)
                 }));
                 setMessages(mapped.reverse());
            });
        } catch (e: any) {
             toast.error('Failed to dispatch message');
        }
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6">
            {/* Guide Contact Column could integrate assigned guide later but right now acts as generic Info Column */}
            <div className="w-80 flex-shrink-0">
                <Card>
                    <div className="text-center mb-6">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name}&background=8b5cf6&color=fff`}
                            alt="Group Comm Panel"
                            className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-violet-100 dark:ring-violet-900"
                        />
                        <h2 className="text-xl font-bold">Group Channel</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Direct Chat System</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">Active Integration</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="font-semibold">Project Group Intercom</h3>
                                <span className="text-xs text-green-500">Live Polling</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                         {messages.length === 0 && (
                            <p className="text-center text-gray-500">No messages found. Start the conversation!</p>
                        )}
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === user?.role ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${message.sender === user?.role
                                            ? 'bg-blue-500 text-white rounded-br-md'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    <p className="text-xs font-bold opacity-75 mb-1 capitalize">{message.sender}</p>
                                    <p className="text-sm leading-relaxed">{message.text}</p>
                                    <span
                                        className={`text-[10px] mt-1 block ${message.sender === user?.role
                                                ? 'text-blue-100'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Chat;
