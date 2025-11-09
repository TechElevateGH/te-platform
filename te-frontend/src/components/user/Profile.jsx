import { useState } from 'react'
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    AcademicCapIcon,
    MapPinIcon,
    GlobeAltIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    BriefcaseIcon,
    LinkIcon
} from '@heroicons/react/24/outline'
import { useData } from '../../context/DataContext';

const Profile = () => {
    const { userInfo } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [editedInfo, setEditedInfo] = useState({
        full_name: userInfo?.full_name || 'John Doe',
        email: userInfo?.email || 'john.doe@example.com',
        phone: userInfo?.phone || '+233 XX XXX XXXX',
        university: userInfo?.university || 'University of Ghana',
        graduation_year: userInfo?.graduation_year || '2025',
        major: userInfo?.major || 'Computer Science',
        company: userInfo?.company || '',
        role: userInfo?.role || '',
        location: userInfo?.location || 'Accra, Ghana',
        linkedin: userInfo?.linkedin || '',
        github: userInfo?.github || '',
        portfolio: userInfo?.portfolio || '',
        bio: userInfo?.bio || 'Passionate software engineer looking to make an impact in tech.',
        interests: userInfo?.interests || 'Full-Stack Development, Cloud Computing, AI/ML'
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        // TODO: Save to backend
        setIsEditing(false);
        console.log('Saving profile:', editedInfo);
    };

    const handleCancel = () => {
        setEditedInfo({
            full_name: userInfo?.full_name || 'John Doe',
            email: userInfo?.email || 'john.doe@example.com',
            phone: userInfo?.phone || '+233 XX XXX XXXX',
            university: userInfo?.university || 'University of Ghana',
            graduation_year: userInfo?.graduation_year || '2025',
            major: userInfo?.major || 'Computer Science',
            company: userInfo?.company || '',
            role: userInfo?.role || '',
            location: userInfo?.location || 'Accra, Ghana',
            linkedin: userInfo?.linkedin || '',
            github: userInfo?.github || '',
            portfolio: userInfo?.portfolio || '',
            bio: userInfo?.bio || 'Passionate software engineer looking to make an impact in tech.',
            interests: userInfo?.interests || 'Full-Stack Development, Cloud Computing, AI/ML'
        });
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setEditedInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Profile
                            </h1>
                            <p className="text-sm text-gray-600">
                                Manage your personal information and preferences
                            </p>
                        </div>
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                            >
                                <PencilIcon className="h-4 w-4" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-32"></div>
                    <div className="px-8 pb-8">
                        <div className="flex items-start gap-6 -mt-16">
                            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                                <UserCircleIcon className="h-28 w-28 text-gray-400" />
                            </div>
                            <div className="flex-1 mt-16">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedInfo.full_name}
                                        onChange={(e) => handleChange('full_name', e.target.value)}
                                        className="text-3xl font-bold text-gray-900 mb-2 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                        {editedInfo.full_name}
                                    </h2>
                                )}
                                <div className="flex items-center gap-2 text-gray-600 mb-3">
                                    <MapPinIcon className="h-5 w-5" />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedInfo.location}
                                            onChange={(e) => handleChange('location', e.target.value)}
                                            className="border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                                            placeholder="Location"
                                        />
                                    ) : (
                                        <span>{editedInfo.location}</span>
                                    )}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editedInfo.bio}
                                        onChange={(e) => handleChange('bio', e.target.value)}
                                        rows={2}
                                        className="text-gray-600 w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                ) : (
                                    <p className="text-gray-600">
                                        {editedInfo.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Information */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editedInfo.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-900 flex items-center gap-2">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                        {editedInfo.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editedInfo.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-900 flex items-center gap-2">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                        {editedInfo.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Education */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                            Education
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">University</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedInfo.university}
                                        onChange={(e) => handleChange('university', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editedInfo.university}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Major</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedInfo.major}
                                            onChange={(e) => handleChange('major', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{editedInfo.major}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Graduation</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedInfo.graduation_year}
                                            onChange={(e) => handleChange('graduation_year', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="2025"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{editedInfo.graduation_year}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employment */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BriefcaseIcon className="h-6 w-6 text-emerald-600" />
                            Employment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Company</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedInfo.company}
                                        onChange={(e) => handleChange('company', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Optional"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editedInfo.company || 'Not currently employed'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Role</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedInfo.role}
                                        onChange={(e) => handleChange('role', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Optional"
                                    />
                                ) : (
                                    <p className="text-gray-900">{editedInfo.role || 'N/A'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <LinkIcon className="h-6 w-6 text-blue-600" />
                            Social Links
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">LinkedIn</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={editedInfo.linkedin}
                                        onChange={(e) => handleChange('linkedin', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="linkedin.com/in/yourprofile"
                                    />
                                ) : (
                                    <p className="text-gray-900 truncate">{editedInfo.linkedin || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">GitHub</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={editedInfo.github}
                                        onChange={(e) => handleChange('github', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="github.com/yourusername"
                                    />
                                ) : (
                                    <p className="text-gray-900 truncate">{editedInfo.github || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Portfolio</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={editedInfo.portfolio}
                                        onChange={(e) => handleChange('portfolio', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="yourwebsite.com"
                                    />
                                ) : (
                                    <p className="text-gray-900 truncate">{editedInfo.portfolio || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interests Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GlobeAltIcon className="h-6 w-6 text-pink-600" />
                        Interests & Skills
                    </h3>
                    {isEditing ? (
                        <textarea
                            value={editedInfo.interests}
                            onChange={(e) => handleChange('interests', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Full-Stack Development, Cloud Computing, AI/ML"
                        />
                    ) : (
                        <p className="text-gray-700">{editedInfo.interests}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile;