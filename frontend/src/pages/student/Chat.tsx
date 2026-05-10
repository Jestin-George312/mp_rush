import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, File as FileIcon, X } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import { studentApi } from '../../services/studentApi';
import { fetchMessages, sendMessage } from '../../services/commsApi';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    text: string;
    sender: string;
    sender_name?: string;
    attachment_url?: string;
    timestamp: Date;
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [groupId, setGroupId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load: determine active project group
    useEffect(() => {
        studentApi.getProjectDetails()
            .then(res => {
                const project = res.data.data;
                if (project && project.id) {
                    // Extract numeric ID if it's a string, assuming the backend uses numbers
                    setGroupId(parseInt(project.id));
                }
            }).catch(console.error);
    }, []);

    // Socket.IO Setup
    useEffect(() => {
        if (!groupId || !socket) return;

        // Join the group room
        socket.emit('join_group', groupId);

        // Fetch initial messages
        fetchMessages(groupId).then(res => {
            const mapped = res.data.map((m: any) => ({
                id: String(m.id),
                text: m.text,
                sender: m.sender_role,
                sender_name: m.sender_name,
                attachment_url: m.attachment_url,
                timestamp: new Date(m.created_at)
            }));
            setMessages(mapped);
        }).catch(console.error);

        // Listen for new messages
        const handleNewMessage = (m: any) => {
            if (m.group_id === groupId) {
                setMessages(prev => [...prev, {
                    id: String(m.id),
                    text: m.text,
                    sender: m.role || m.sender_role,
                    sender_name: m.sender_name,
                    attachment_url: m.attachment_url,
                    timestamp: new Date(m.created_at)
                }]);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.emit('leave_group', groupId);
        };
    }, [groupId, socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if ((!inputValue.trim() && !selectedFile) || !groupId) {
             if(!groupId) toast.error("No active project found.");
             return;
        }

        try {
            await sendMessage(groupId, inputValue, selectedFile || undefined);
            setInputValue('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e: any) {
             toast.error('Failed to send message');
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
            <div className="w-80 flex-shrink-0">
                <Card>
                    <div className="text-center mb-6">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name}&background=8b5cf6&color=fff`}
                            alt="Panel"
                            className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-violet-100 dark:ring-violet-900"
                        />
                        <h2 className="text-xl font-bold">Group Channel</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time Intercom</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold">Project Group Intercom</h3>
                        <span className="text-xs text-blue-500 font-bold">SOCKET.IO ACTIVE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {messages.length === 0 && (
                            <p className="text-center text-gray-500">Start the conversation!</p>
                        )}
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === user?.role?.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${message.sender === user?.role?.toLowerCase()
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    <p className="text-[10px] font-black opacity-75 mb-1 uppercase">
                                        {message.sender_name || message.sender}
                                    </p>
                                    
                                    {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
                                    
                                    {message.attachment_url && (
                                        <a 
                                            href={message.attachment_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className={`mt-2 flex items-center gap-2 p-2 rounded-lg border ${
                                                message.sender === user?.role?.toLowerCase()
                                                ? 'bg-white/10 border-white/20 text-white'
                                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            <FileIcon size={16} />
                                            <span className="text-xs font-bold truncate max-w-[150px]">
                                                {message.attachment_url.split('/').pop()}
                                            </span>
                                        </a>
                                    )}

                                    <span className={`text-[9px] mt-1 block ${message.sender === user?.role?.toLowerCase() ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        {selectedFile && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileIcon size={16} />
                                    <span className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                            >
                                <Paperclip size={20} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
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
                                disabled={!inputValue.trim() && !selectedFile}
                                className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
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
