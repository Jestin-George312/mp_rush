import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, File as FileIcon, X, Star } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import { studentApi, type StudentProject } from '../../services/studentApi';
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
    const [project, setProject] = useState<StudentProject | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load: determine active project group
    useEffect(() => {
        studentApi.getProjectDetails()
            .then(res => {
                const proj = res.data.data;
                setProject(proj);
                if (proj && proj.groupId) {
                    setGroupId(proj.groupId);
                }
            }).catch(console.error);
    }, []);

    // Socket.IO Setup
    useEffect(() => {
        if (!groupId || !socket) return;

        // Join the group room
        socket.emit('join_group', groupId);

        // Fetch initial messages
        fetchMessages(groupId).then(data => {
            const mapped = data.map((m: any) => ({
                id: String(m.id),
                text: m.text,
                sender: m.senderRole,
                sender_name: m.senderName,
                attachment_url: m.attachmentUrl,
                timestamp: new Date(m.createdAt)
            }));
            setMessages(mapped);
        }).catch(console.error);

        // Listen for new messages
        const handleNewMessage = (m: any) => {
            if (m.group_id === groupId || m.groupId === groupId) {
                const newMsg = {
                    id: String(m.id),
                    text: m.text,
                    sender: m.senderRole || m.role,
                    sender_name: m.senderName || m.sender_name,
                    attachment_url: m.attachmentUrl || m.attachment_url,
                    timestamp: new Date(m.createdAt || m.created_at)
                };
                setMessages(prev => {
                    if (prev.some(msg => msg.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
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

    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

    const handleSend = async () => {
        if ((!inputValue.trim() && !selectedFile) || !groupId) {
             if(!groupId) toast.error("No active project found.");
             return;
        }

        const msgText = inputValue.trim();
        const fileToUpload = selectedFile;
        
        try {
            const res = await sendMessage(groupId, msgText, fileToUpload || undefined);
            
            // Get the actual URL returned by the backend
            const serverAttachmentUrl = res?.data?.data?.attachment_url || res?.data?.data?.attachmentUrl;

            // Optimistic update: show your own message immediately with file info
            const sentMsg: Message = {
                id: res?.data?.data?.id ? String(res.data.data.id) : `temp-${Date.now()}`,
                text: msgText,
                sender: user?.role?.toLowerCase() || 'student',
                sender_name: user?.name || 'You',
                attachment_url: serverAttachmentUrl,
                timestamp: new Date()
            };

            setMessages(prev => {
                if (prev.some(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });

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

    const getFullFileUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6">
            <div className="w-80 flex-shrink-0 flex flex-col gap-6">
                <Card className="flex-shrink-0">
                    <div className="text-center">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name}&background=8b5cf6&color=fff`}
                            alt="Panel"
                            className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-violet-100 dark:ring-violet-900"
                        />
                        <h2 className="text-lg font-bold">Group Channel</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Real-time Intercom</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                {connected ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        {project && (
                            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                    project.mode === 'Group' 
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                    {project.mode}
                                </span>
                                {project.domain && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                        {project.domain}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Team Participants</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {project?.members.map(member => (
                            <div key={member.uid} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-black text-xs">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    {member.is_leader && (
                                        <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full shadow-sm">
                                            <Star size={10} className="fill-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate">{member.full_name} {member.uid === String(user?.id) ? '(You)' : ''}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                        {member.is_leader ? 'Group Leader' : 'Collaborator'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {project?.guideName && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Project Guide</p>
                                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-900 text-white">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                                        {project.guideName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black truncate">{project.guideName}</p>
                                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Assigned Mentor</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-2xl border-0 ring-1 ring-black/5">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-green-500" />
                             <h3 className="font-bold text-gray-800 dark:text-white">Project Group Intercom</h3>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-black uppercase tracking-tighter">SOCKET.IO ACTIVE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50 scroll-smooth">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full opacity-30">
                                <FileIcon size={48} className="mb-2" />
                                <p className="font-bold uppercase text-xs tracking-widest">Start the conversation</p>
                            </div>
                        )}
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === user?.role?.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] px-4 py-3 rounded-2xl transition-all hover:scale-[1.01] ${message.sender === user?.role?.toLowerCase()
                                            ? 'bg-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    <p className={`text-[10px] font-black opacity-75 mb-1 uppercase tracking-wider ${message.sender === user?.role?.toLowerCase() ? 'text-blue-100' : 'text-blue-600'}`}>
                                        {message.sender_name || message.sender}
                                    </p>
                                    
                                    {message.text && <p className="text-sm leading-relaxed font-medium">{message.text}</p>}
                                    
                                    {message.attachment_url && (
                                        <a 
                                            href={getFullFileUrl(message.attachment_url)} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className={`mt-2 flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-black/5 ${
                                                message.sender === user?.role?.toLowerCase()
                                                ? 'bg-white/10 border-white/20 text-white'
                                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <FileIcon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-black truncate block">
                                                    {message.attachment_url.split('/').pop()?.split('-').shift() || 'Attachment'}
                                                </span>
                                                <span className="text-[9px] opacity-60 uppercase font-bold">Click to view file</span>
                                            </div>
                                        </a>
                                    )}

                                    <span className={`text-[9px] mt-2 block font-bold text-right ${message.sender === user?.role?.toLowerCase() ? 'text-blue-100' : 'text-gray-400'}`}>
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
