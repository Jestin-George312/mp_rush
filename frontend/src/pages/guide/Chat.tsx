import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, MoreVertical, Users, Paperclip, File as FileIcon, X } from 'lucide-react';
import { guideApi, type ProjectGroupMeta } from '../../services/guideApi';
import { fetchMessages, sendMessage } from '../../services/commsApi';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    text: string;
    sender: string;
    senderName?: string;
    attachment_url?: string;
    timestamp: Date;
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [groups, setGroups] = useState<ProjectGroupMeta[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ProjectGroupMeta | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load: fetch supervised groups
    useEffect(() => {
        guideApi.getSupervisedGroups()
            .then(res => {
                setGroups(res.data.data || []);
                if (res.data.data?.length > 0) {
                    setSelectedGroup(res.data.data[0]);
                }
            }).catch(console.error);
    }, []);

    // Socket.IO Setup
    useEffect(() => {
        if (!selectedGroup || !socket) return;

        const gid = parseInt(selectedGroup.id);
        
        // Join the group room
        socket.emit('join_group', gid);

        // Fetch initial messages
        fetchMessages(gid).then(res => {
            const mapped = res.data.map((m: any) => ({
                id: String(m.id),
                text: m.text,
                sender: m.sender_role,
                senderName: m.sender_name,
                attachment_url: m.attachment_url,
                timestamp: new Date(m.created_at)
            }));
            setMessages(mapped);
        }).catch(console.error);

        // Listen for new messages
        const handleNewMessage = (m: any) => {
            if (m.group_id === gid) {
                setMessages(prev => [...prev, {
                    id: String(m.id),
                    text: m.text,
                    sender: m.role || m.sender_role,
                    senderName: m.sender_name,
                    attachment_url: m.attachment_url,
                    timestamp: new Date(m.created_at)
                }]);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.emit('leave_group', gid);
        };
    }, [selectedGroup, socket]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if ((!inputValue.trim() && !selectedFile) || !selectedGroup) return;

        const gid = parseInt(selectedGroup.id);
        try {
            await sendMessage(gid, inputValue, selectedFile || undefined);
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

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Left Column - Group List */}
            <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                    <h2 className="text-xl font-black mb-3">Messages</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`w-full p-4 flex items-start gap-3 text-left border-b border-gray-100 dark:border-gray-700/50 transition-colors ${selectedGroup?.id === group.id
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                                {group.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate text-sm">{group.name}</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase font-black">{group.title}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate font-medium">Click to chat</p>
                            </div>
                        </button>
                    ))}
                    {filteredGroups.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            <Users size={40} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">No groups found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Chat Interface */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                {selectedGroup ? (
                    <>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                                    {selectedGroup.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedGroup.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Users size={12} />
                                        <span>{selectedGroup.members.length} members</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="capitalize">{connected ? 'Live' : 'Offline'}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'guide' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${message.sender === 'guide'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                                            }`}
                                    >
                                        <p className={`text-[10px] font-black mb-1 uppercase ${message.sender === 'guide' ? 'text-blue-100' : 'text-blue-500'}`}>
                                            {message.senderName || message.sender}
                                        </p>
                                        
                                        {message.text && <p className="text-sm leading-relaxed font-medium">{message.text}</p>}
                                        
                                        {message.attachment_url && (
                                            <a 
                                                href={message.attachment_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className={`mt-2 flex items-center gap-2 p-2 rounded-lg border ${
                                                    message.sender === 'guide'
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

                                        <span className={`text-[9px] mt-1 block font-bold ${message.sender === 'guide' ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
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
                                    placeholder={`Message ${selectedGroup.name}...`}
                                    className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() && !selectedFile}
                                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-12 text-center text-gray-400">
                        <div>
                            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="opacity-20" />
                            </div>
                            <h3 className="text-lg font-black text-gray-600 dark:text-gray-300">Select a Group</h3>
                            <p className="text-sm font-medium max-w-xs mt-2">Choose a project group from the left sidebar to start real-time coordination.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
