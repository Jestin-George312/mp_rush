import React, { useState } from 'react';
import { Video, Calendar, Clock, Plus, Users } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Textarea from '../../components/common/UI/Textarea';
import Select from '../../components/common/UI/Select';

interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    agenda: string;
    meetLink: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    group: {
        id: string;
        name: string;
        projectTitle: string;
        picture: string;
    };
}

interface StudentGroup {
    id: string;
    name: string;
    projectTitle: string;
    picture: string;
}

const studentGroups: StudentGroup[] = [
    { id: 'g1', name: 'Team Alpha', projectTitle: 'E-Commerce Platform', picture: 'https://ui-avatars.com/api/?name=Team+Alpha&background=3b82f6&color=fff' },
    { id: 'g2', name: 'Team Beta', projectTitle: 'Hospital Management', picture: 'https://ui-avatars.com/api/?name=Team+Beta&background=10b981&color=fff' },
    { id: 'g3', name: 'Team Gamma', projectTitle: 'Student Portal', picture: 'https://ui-avatars.com/api/?name=Team+Gamma&background=f59e0b&color=fff' },
    { id: 'g4', name: 'Team Delta', projectTitle: 'Library System', picture: 'https://ui-avatars.com/api/?name=Team+Delta&background=8b5cf6&color=fff' },
];

const initialMeetings: Meeting[] = [
    {
        id: '1',
        title: 'Project Review - SRS Discussion',
        date: '2026-02-05',
        time: '10:00 AM',
        duration: '45 mins',
        agenda: 'Review the SRS document, discuss use case diagrams, and finalize database schema.',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        status: 'upcoming',
        group: studentGroups[0],
    },
    {
        id: '2',
        title: 'Prototype Demo',
        date: '2026-02-08',
        time: '2:00 PM',
        duration: '1 hour',
        agenda: 'Team Beta to demonstrate their Hospital Management prototype.',
        meetLink: 'https://meet.google.com/xyz-uvwx-rst',
        status: 'upcoming',
        group: studentGroups[1],
    },
    {
        id: '3',
        title: 'Project Kickoff',
        date: '2026-02-10',
        time: '11:00 AM',
        duration: '30 mins',
        agenda: 'Initial kickoff meeting with Team Gamma for Student Portal project.',
        meetLink: 'https://meet.google.com/new-meet-123',
        status: 'upcoming',
        group: studentGroups[2],
    },
    {
        id: '4',
        title: 'Initial Review - Team Alpha',
        date: '2026-01-20',
        time: '11:00 AM',
        duration: '30 mins',
        agenda: 'Introduction and project scope discussion.',
        meetLink: '',
        status: 'completed',
        group: studentGroups[0],
    },
    {
        id: '5',
        title: 'Database Design Review',
        date: '2026-01-25',
        time: '3:00 PM',
        duration: '45 mins',
        agenda: 'Review database schema for Library System.',
        meetLink: '',
        status: 'completed',
        group: studentGroups[3],
    },
];

const Meetings: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        groupId: '',
        title: '',
        date: '',
        time: '',
        duration: '30',
        agenda: '',
    });

    const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');
    const pastMeetings = meetings.filter(m => m.status !== 'upcoming');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedGroup = studentGroups.find(g => g.id === formData.groupId);
        if (!selectedGroup) return;

        const newMeeting: Meeting = {
            id: Date.now().toString(),
            title: formData.title || `Meeting with ${selectedGroup.name}`,
            date: formData.date,
            time: formData.time,
            duration: `${formData.duration} mins`,
            agenda: formData.agenda,
            meetLink: `https://meet.google.com/${Math.random().toString(36).slice(2, 11)}`,
            status: 'upcoming',
            group: selectedGroup,
        };

        setMeetings(prev => [newMeeting, ...prev]);
        setFormData({ groupId: '', title: '', date: '', time: '', duration: '30', agenda: '' });
        setIsModalOpen(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <Card>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <img
                        src={meeting.group.picture}
                        alt={meeting.group.name}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{meeting.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default">{meeting.group.name}</Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{meeting.group.projectTitle}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(meeting.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {meeting.time} ({meeting.duration})
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{meeting.agenda}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={meeting.status === 'upcoming' ? 'success' : 'default'}>
                        {meeting.status === 'upcoming' ? 'Scheduled' : 'Completed'}
                    </Badge>
                    {meeting.status === 'upcoming' && meeting.meetLink && (
                        <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                        >
                            <Video size={14} /> Start Meet
                        </a>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Meeting Schedule</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage meetings with your student groups</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Schedule Meeting
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Meetings</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                            <Video size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pastMeetings.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Meetings</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                            <Users size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{studentGroups.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Groups</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Upcoming Meetings */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Upcoming Meetings</h2>
                {upcomingMeetings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingMeetings.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No upcoming meetings. Schedule a meeting with a student group.
                        </p>
                    </Card>
                )}
            </div>

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Past Meetings</h2>
                    <div className="space-y-4">
                        {pastMeetings.map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                </div>
            )}

            {/* Schedule Meeting Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Meeting">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Select Group"
                        value={formData.groupId}
                        onChange={e => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                        required
                    >
                        <option value="">-- Select a Group --</option>
                        {studentGroups.map(group => (
                            <option key={group.id} value={group.id}>
                                {group.name} - {group.projectTitle}
                            </option>
                        ))}
                    </Select>

                    <Input
                        label="Meeting Title"
                        placeholder="e.g., Project Review"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                        <Input
                            label="Time"
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                            required
                        />
                        <Select
                            label="Duration"
                            value={formData.duration}
                            onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        >
                            <option value="15">15 mins</option>
                            <option value="30">30 mins</option>
                            <option value="45">45 mins</option>
                            <option value="60">1 hour</option>
                        </Select>
                    </div>

                    <Textarea
                        label="Agenda"
                        placeholder="Meeting agenda and discussion points..."
                        rows={4}
                        value={formData.agenda}
                        onChange={e => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                        required
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Schedule Meeting
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Meetings;
