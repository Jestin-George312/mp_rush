import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, MoreVertical, Users } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'guide' | 'student';
    senderName?: string;
    timestamp: Date;
}

interface StudentGroup {
    id: string;
    name: string;
    projectTitle: string;
    members: number;
    lastMessage: string;
    lastMessageTime: Date;
    unread: number;
    picture: string;
}

// Mock student groups
const studentGroups: StudentGroup[] = [
    {
        id: 'g1',
        name: 'Team Alpha',
        projectTitle: 'E-Commerce Platform',
        members: 4,
        lastMessage: 'We will have the SRS ready by Friday.',
        lastMessageTime: new Date(Date.now() - 900000),
        unread: 2,
        picture: 'https://ui-avatars.com/api/?name=Team+Alpha&background=3b82f6&color=fff',
    },
    {
        id: 'g2',
        name: 'Team Beta',
        projectTitle: 'Hospital Management',
        members: 3,
        lastMessage: 'Thank you for the feedback!',
        lastMessageTime: new Date(Date.now() - 3600000 * 3),
        unread: 0,
        picture: 'https://ui-avatars.com/api/?name=Team+Beta&background=10b981&color=fff',
    },
    {
        id: 'g3',
        name: 'Team Gamma',
        projectTitle: 'Student Portal',
        members: 4,
        lastMessage: 'Can we schedule a meeting this week?',
        lastMessageTime: new Date(Date.now() - 3600000 * 24),
        unread: 1,
        picture: 'https://ui-avatars.com/api/?name=Team+Gamma&background=f59e0b&color=fff',
    },
    {
        id: 'g4',
        name: 'Team Delta',
        projectTitle: 'Library System',
        members: 3,
        lastMessage: 'The prototype is ready for review.',
        lastMessageTime: new Date(Date.now() - 3600000 * 48),
        unread: 0,
        picture: 'https://ui-avatars.com/api/?name=Team+Delta&background=8b5cf6&color=fff',
    },
];

// Mock messages per group
const mockMessages: Record<string, Message[]> = {
    g1: [
        { id: '1', text: 'Hello Team Alpha! I wanted to discuss the progress on your E-Commerce project.', sender: 'guide', timestamp: new Date(Date.now() - 3600000 * 2) },
        { id: '2', text: 'Hi Dr. Johnson! We have completed the authentication module.', sender: 'student', senderName: 'John (Team Lead)', timestamp: new Date(Date.now() - 3600000 * 1.5) },
        { id: '3', text: 'Great progress! Please submit the SRS document by Friday.', sender: 'guide', timestamp: new Date(Date.now() - 3600000) },
        { id: '4', text: 'We will have the SRS ready by Friday.', sender: 'student', senderName: 'John (Team Lead)', timestamp: new Date(Date.now() - 900000) },
    ],
    g2: [
        { id: '1', text: 'Team Beta, I reviewed your database design. Looks good overall.', sender: 'guide', timestamp: new Date(Date.now() - 3600000 * 5) },
        { id: '2', text: 'Thank you for the feedback!', sender: 'student', senderName: 'Jane', timestamp: new Date(Date.now() - 3600000 * 3) },
    ],
    g3: [
        { id: '1', text: 'Your project proposal has been approved!', sender: 'guide', timestamp: new Date(Date.now() - 3600000 * 26) },
        { id: '2', text: 'That is great news! We will start working immediately.', sender: 'student', senderName: 'Alex', timestamp: new Date(Date.now() - 3600000 * 25) },
        { id: '3', text: 'Can we schedule a meeting this week?', sender: 'student', senderName: 'Alex', timestamp: new Date(Date.now() - 3600000 * 24) },
    ],
    g4: [
        { id: '1', text: 'How is the Library System coming along?', sender: 'guide', timestamp: new Date(Date.now() - 3600000 * 50) },
        { id: '2', text: 'The prototype is ready for review.', sender: 'student', senderName: 'Sarah', timestamp: new Date(Date.now() - 3600000 * 48) },
    ],
};

const Chat: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<StudentGroup>(studentGroups[0]);
    const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentMessages = messages[selectedGroup.id] || [];

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'guide',
            timestamp: new Date(),
        };

        setMessages(prev => ({
            ...prev,
            [selectedGroup.id]: [...(prev[selectedGroup.id] || []), newMessage],
        }));
        setInputValue('');
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

    const formatLastSeen = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const filteredGroups = studentGroups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Left Column - Group List */}
            <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-3">Messages</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Group List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredGroups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${selectedGroup.id === group.id
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <img
                                src={group.picture}
                                alt={group.name}
                                className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold truncate">{group.name}</h3>
                                    <span className="text-xs text-gray-400">{formatLastSeen(group.lastMessageTime)}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.projectTitle}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">{group.lastMessage}</p>
                            </div>
                            {group.unread > 0 && (
                                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {group.unread}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Column - Chat Interface */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <img
                            src={selectedGroup.picture}
                            alt={selectedGroup.name}
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <h3 className="font-semibold">{selectedGroup.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Users size={12} />
                                <span>{selectedGroup.members} members</span>
                                <span>•</span>
                                <span>{selectedGroup.projectTitle}</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                    {currentMessages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'guide' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-2xl ${message.sender === 'guide'
                                    ? 'bg-blue-500 text-white rounded-br-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm'
                                    }`}
                            >
                                {message.sender === 'student' && message.senderName && (
                                    <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-1">
                                        {message.senderName}
                                    </p>
                                )}
                                <p className="text-sm leading-relaxed">{message.text}</p>
                                <span
                                    className={`text-xs mt-1 block ${message.sender === 'guide'
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
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${selectedGroup.name}...`}
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
            </div>
        </div>
    );
};

export default Chat;
