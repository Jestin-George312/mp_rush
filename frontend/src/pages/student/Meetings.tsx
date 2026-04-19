import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, ExternalLink, Plus } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import Textarea from '../../components/common/UI/Textarea';
import { fetchProjects } from '../../services/projectApi';
import { fetchMeetings, createMeeting } from '../../services/meetingApi';
import toast from 'react-hot-toast';

interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    agenda: string;
    meetLink: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

const Meetings: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [groupId, setGroupId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        agenda: '',
        duration: '30 mins'
    });

    useEffect(() => {
        fetchProjects().then(res => {
            if (res.data && res.data.length > 0) {
                const project = res.data[0];
                setProjectId(project.id);
                setGroupId(project.group_id);
                loadMeetings();
            }
        }).catch(err => console.error(err));
    }, []);

    const loadMeetings = () => {
        fetchMeetings().then(res => {
            const items = res.data.map((m: any) => ({
                id: m.id,
                title: m.title || 'Project Discussion',
                date: m.date,
                time: m.time,
                duration: m.duration || '30 mins',
                agenda: m.agenda,
                meetLink: m.meet_link || '',
                status: m.status
            }));
            setMeetings(items);
        }).catch(e => console.error(e));
    };

    const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');
    const pastMeetings = meetings.filter(m => m.status !== 'upcoming');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !groupId) {
            toast.error("You must have an active project first.");
            return;
        }

        try {
            await createMeeting({
                project_id: projectId,
                group_id: groupId,
                title: formData.title || 'Meeting Request',
                date: formData.date,
                time: formData.time,
                duration: formData.duration,
                agenda: formData.agenda
            });
            toast.success("Meeting requested successfully!");
            loadMeetings();
            setFormData({ title: '', date: '', time: '', agenda: '', duration: '30 mins' });
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error("Failed to request meeting.");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
        <Card>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${meeting.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Video size={24} className={meeting.status === 'upcoming' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{meeting.title}</h3>
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
                        {meeting.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </Badge>
                    {meeting.status === 'upcoming' && meeting.meetLink && (
                        <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                        >
                            Join Meet <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Meetings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage meetings</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> Request Meeting
                </Button>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">Upcoming ({upcomingMeetings.length})</h2>
                {upcomingMeetings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingMeetings.map(m => (
                            <MeetingCard key={m.id} meeting={m} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No upcoming meetings. Request one above!
                        </p>
                    </Card>
                )}
            </div>

            {pastMeetings.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Past Meetings</h2>
                    <div className="space-y-4">
                        {pastMeetings.map(m => (
                            <MeetingCard key={m.id} meeting={m} />
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Meeting">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Meeting Title"
                        placeholder="e.g., Project Review"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Preferred Date"
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                        <Input
                            label="Preferred Time"
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                            required
                        />
                    </div>

                    <Input
                        label="Duration"
                        placeholder="e.g., 30 mins"
                        value={formData.duration}
                        onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        required
                    />

                    <Textarea
                        label="Agenda / Discussion Points"
                        placeholder="What would you like to discuss?"
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
                            Request
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Meetings;
