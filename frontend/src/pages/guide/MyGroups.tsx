import React, { useState } from 'react';
import { Users, FolderGit2, Calendar, Mail, MessageSquare } from 'lucide-react';

interface Student {
    id: number;
    name: string;
    email: string;
}

interface Group {
    id: string;
    projectName: string;
    domain: string;
    students: Student[];
    nextMeeting: string;
    progress: number;
}

const MyGroups: React.FC = () => {
    // Dummy data for groups
    const [groups] = useState<Group[]>([
        {
            id: 'GRP-2026-01',
            projectName: 'AI-Powered Healthcare System',
            domain: 'Artificial Intelligence',
            students: [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Alice Smith', email: 'alice@example.com' },
            ],
            nextMeeting: 'Tomorrow, 10:00 AM',
            progress: 45,
        },
        {
            id: 'GRP-2026-02',
            projectName: 'Blockchain Voting Mechanism',
            domain: 'Blockchain',
            students: [
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
                { id: 4, name: 'Emma Davis', email: 'emma@example.com' },
                { id: 5, name: 'Charlie Brown', email: 'charlie@example.com' },
            ],
            nextMeeting: 'Wed, Oct 25, 2:00 PM',
            progress: 70,
        },
        {
            id: 'GRP-2026-03',
            projectName: 'Smart City Traffic Prediction',
            domain: 'Machine Learning',
            students: [
                { id: 6, name: 'Sarah Wilson', email: 'sarah@example.com' },
                { id: 7, name: 'Michael Taylor', email: 'michael@example.com' },
            ],
            nextMeeting: 'Fri, Oct 27, 11:30 AM',
            progress: 15,
        },
    ]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Groups</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your {groups.length} assigned project groups
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Card Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                    {group.id}
                                </span>
                                <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {group.domain}
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {group.projectName}
                            </h2>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Project Progress</span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{group.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                    <div
                                        className="bg-blue-600 h-1.5 rounded-full"
                                        style={{ width: `${group.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Card Body - Students List */}
                        <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                Team Members ({group.students.length})
                            </h3>
                            <div className="space-y-3">
                                {group.students.map((student) => (
                                    <div key={student.id} className="flex justify-between items-center bg-white dark:bg-gray-700 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                                {student.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Mail size={10} /> {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-600 rounded-md">
                                            <MessageSquare size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Calendar size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" />
                                <span>Next: {group.nextMeeting}</span>
                            </div>
                            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1">
                                <FolderGit2 size={14} />
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyGroups;
