import React, { useState, useEffect } from 'react';
import { Camera, Mail, Phone, MapPin, Briefcase, Save } from 'lucide-react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Input from '../../components/common/UI/Input';
import Textarea from '../../components/common/UI/Textarea';
import { useAuth } from '../../hooks/useAuth';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        department: '',
        bio: '',
        location: '',
        profile_img: ''
    });

    useEffect(() => {
        // Fetch real profile configurations immediately upon loading logic
        API.get('/users/profile').then(res => {
            const data = res.data.data;
            setFormData({
                name: data.full_name || user?.name || '',
                email: data.email || user?.email || '',
                phone: data.phone || '',
                department: data.department || '',
                bio: data.bio || '',
                location: data.location || '',
                profile_img: data.profile_img || ''
            });
        }).catch(err => console.error(err));
    }, [user]);

    const handleSave = async () => {
        try {
            await API.patch('/users/profile', {
                full_name: formData.name,
                phone: formData.phone,
                department: formData.department,
                bio: formData.bio,
                location: formData.location
            });
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (e: any) {
            toast.error("Failed to update profile configurations");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage your personal information
                </p>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={formData.profile_img || `https://ui-avatars.com/api/?name=${formData.name}&size=128&background=6366f1&color=fff`}
                                alt={formData.name}
                                className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700"
                            />
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">{formData.name}</h2>
                        <span className="inline-block mt-1 px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full capitalize">
                            {user?.role}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Personal Information</h3>
                            <Button
                                variant={isEditing ? 'primary' : 'outline'}
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            >
                                {isEditing ? (
                                    <>
                                        <Save size={16} className="mr-2" /> Save Changes
                                    </>
                                ) : (
                                    'Edit Profile'
                                )}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Full Name
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                ) : (
                                    <p className="text-base">{formData.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Email (Read Only)
                                </label>
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-gray-400" />
                                    <p className="text-base text-gray-500">{formData.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Phone
                                </label>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-gray-400" />
                                    {isEditing ? (
                                        <Input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    ) : (
                                        <p className="text-base">{formData.phone || "Not Set"}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Department
                                </label>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} className="text-gray-400" />
                                    {isEditing ? (
                                        <Input
                                            value={formData.department}
                                            onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                        />
                                    ) : (
                                        <p className="text-base">{formData.department || "Not Set"}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Location
                                </label>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    {isEditing ? (
                                        <Input
                                            value={formData.location}
                                            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        />
                                    ) : (
                                        <p className="text-base">{formData.location || "Not Set"}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Bio
                            </label>
                            {isEditing ? (
                                <Textarea
                                    rows={3}
                                    value={formData.bio}
                                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                />
                            ) : (
                                <p className="text-base text-gray-600 dark:text-gray-300">{formData.bio || "No bio yet."}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Profile;
