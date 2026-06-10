import { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { XMarkIcon, PlusIcon, TrashIcon } from 'icons';

// Import DSA topics for category/topic selection
import { dsaTopics } from '../../data/dsaTopics';

// Extract category names from dsaTopics
const categories = dsaTopics.map(topic => topic.category);

const LessonCreateDSA = ({ isOpen, onClose, onSuccess, editLesson = null, defaultCategory = null, defaultTopic = null }) => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: defaultCategory || '',
        topic: defaultTopic || '',
        description: '',
        video_id: '',
        content_type: 'video',
        difficulty: 'Beginner',
        instructor: '',
        duration_minutes: null,
        is_published: true,
        tags: [],
        resources: [],
        code_examples: [],
    });

    // Dynamic states
    const [newTag, setNewTag] = useState('');
    const [newResource, setNewResource] = useState({ title: '', url: '' });
    const [newCodeExample, setNewCodeExample] = useState({ language: 'python', code: '' });
    const [availableTopics, setAvailableTopics] = useState([]);

    // Load edit data if editing
    useEffect(() => {
        if (editLesson) {
            setFormData({
                title: editLesson.title || '',
                category: editLesson.category || '',
                topic: editLesson.topic || '',
                description: editLesson.description || '',
                video_id: editLesson.video_id || '',
                content_type: editLesson.content_type || 'video',
                difficulty: editLesson.difficulty || 'Beginner',
                instructor: editLesson.instructor || '',
                duration_minutes: editLesson.duration_minutes || null,
                is_published: editLesson.is_published !== undefined ? editLesson.is_published : true,
                tags: editLesson.tags || [],
                resources: editLesson.resources || [],
                code_examples: editLesson.code_examples || [],
            });

            // Load topics for the category
            if (editLesson.category) {
                const categoryData = dsaTopics.find(c => c.category === editLesson.category);
                if (categoryData) {
                    setAvailableTopics(categoryData.topics.map(t => t.name));
                }
            }
        }
    }, [editLesson]);

    // Update available topics when category changes
    useEffect(() => {
        if (formData.category) {
            const categoryData = dsaTopics.find(c => c.category === formData.category);
            if (categoryData) {
                setAvailableTopics(categoryData.topics.map(t => t.name));
            } else {
                setAvailableTopics([]);
            }
        } else {
            setAvailableTopics([]);
        }
    }, [formData.category]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()],
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    const handleAddResource = () => {
        if (newResource.title.trim() && newResource.url.trim()) {
            setFormData(prev => ({
                ...prev,
                resources: [...prev.resources, { ...newResource }],
            }));
            setNewResource({ title: '', url: '' });
        }
    };

    const handleRemoveResource = (index) => {
        setFormData(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index),
        }));
    };

    const handleAddCodeExample = () => {
        if (newCodeExample.code.trim()) {
            setFormData(prev => ({
                ...prev,
                code_examples: [...prev.code_examples, { ...newCodeExample }],
            }));
            setNewCodeExample({ language: 'python', code: '' });
        }
    };

    const handleRemoveCodeExample = (index) => {
        setFormData(prev => ({
            ...prev,
            code_examples: prev.code_examples.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const endpoint = editLesson
                ? `/learning/lessons/${editLesson.id}`
                : '/learning/lessons';
            const method = editLesson ? 'patch' : 'post';

            const response = await axiosInstance[method](endpoint, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess && onSuccess(response.data);
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error saving lesson:', error);
            toast.error('Failed to save lesson. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
                <div className="w-screen max-w-4xl">
                    <div className="flex h-full flex-col bg-[var(--te-surface)] shadow-sm">
                        {/* Header */}
                        <div className="bg-[var(--te-surface-alt)] px-6 py-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-[var(--te-text)]">
                                    {editLesson ? 'Edit Lesson' : 'Create New DSA Lesson'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="te-icon-btn text-[var(--te-text)] hover:bg-[var(--te-surface)]"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {showSuccess && (
                            <div className="mx-6 mt-4 rounded-md bg-[var(--te-surface-alt)] p-4">
                                <p className="text-sm font-medium text-[var(--te-text)]">
                                    ✓ Lesson {editLesson ? 'updated' : 'created'} successfully!
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Basic Information</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                Lesson Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                className="te-input"
                                                placeholder="e.g., Mastering Two Pointers Technique"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => {
                                                        handleInputChange('category', e.target.value);
                                                        handleInputChange('topic', ''); // Reset topic when category changes
                                                    }}
                                                    className="te-select"
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    Topic <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.topic}
                                                    onChange={(e) => handleInputChange('topic', e.target.value)}
                                                    className="te-select"
                                                    disabled={!formData.category}
                                                    required
                                                >
                                                    <option value="">Select Topic</option>
                                                    {availableTopics.map(topic => (
                                                        <option key={topic} value={topic}>{topic}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                rows={3}
                                                className="te-textarea"
                                                placeholder="Brief description of what this lesson covers..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Content Details</h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    Content Type
                                                </label>
                                                <select
                                                    value={formData.content_type}
                                                    onChange={(e) => handleInputChange('content_type', e.target.value)}
                                                    className="te-select"
                                                >
                                                    <option value="video">Video</option>
                                                    <option value="article">Article</option>
                                                    <option value="interactive">Interactive</option>
                                                    <option value="mixed">Mixed</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    Difficulty Level
                                                </label>
                                                <select
                                                    value={formData.difficulty}
                                                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                                    className="te-select"
                                                >
                                                    <option value="Beginner">Beginner</option>
                                                    <option value="Easy">Easy</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Hard">Hard</option>
                                                    <option value="Advanced">Advanced</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    YouTube Video ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.video_id}
                                                    onChange={(e) => handleInputChange('video_id', e.target.value)}
                                                    className="te-input"
                                                    placeholder="e.g., dQw4w9WgXcQ"
                                                />
                                                <p className="mt-1 text-xs text-[var(--te-text-dim)] text-[var(--te-text-dim)]">
                                                    The ID from youtube.com/watch?v=<strong>VIDEO_ID</strong>
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                    Duration (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.duration_minutes || ''}
                                                    onChange={(e) => handleInputChange('duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                                                    className="te-input"
                                                    placeholder="e.g., 45"
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--te-text)]  mb-1">
                                                Instructor Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.instructor}
                                                onChange={(e) => handleInputChange('instructor', e.target.value)}
                                                className="te-input"
                                                placeholder="e.g., John Doe"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Tags</h3>

                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            className="te-input flex-1"
                                            placeholder="Add a tag (e.g., two-pointers, optimization)"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="te-btn-primary"
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded-full text-sm"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="te-icon-btn"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Resources */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Additional Resources</h3>

                                    <div className="space-y-2 mb-3">
                                        <input
                                            type="text"
                                            value={newResource.title}
                                            onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                                            className="te-input"
                                            placeholder="Resource title (e.g., LeetCode Problem #1)"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={newResource.url}
                                                onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                                                className="te-input flex-1"
                                                placeholder="https://..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddResource}
                                                className="te-btn-primary"
                                            >
                                                <PlusIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {formData.resources.map((resource, index) => (
                                            <div key={index} className="te-panel flex items-center gap-2 p-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{resource.title}</p>
                                                    <a
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-[var(--te-text)] hover:underline"
                                                    >
                                                        {resource.url}
                                                    </a>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveResource(index)}
                                                    className="te-icon-btn text-red-600 dark:text-red-400"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Code Examples */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Code Examples</h3>

                                    <div className="space-y-2 mb-3">
                                        <select
                                            value={newCodeExample.language}
                                            onChange={(e) => setNewCodeExample(prev => ({ ...prev, language: e.target.value }))}
                                            className="te-select"
                                        >
                                            <option value="python">Python</option>
                                            <option value="javascript">JavaScript</option>
                                            <option value="java">Java</option>
                                            <option value="cpp">C++</option>
                                            <option value="go">Go</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <textarea
                                                value={newCodeExample.code}
                                                onChange={(e) => setNewCodeExample(prev => ({ ...prev, code: e.target.value }))}
                                                rows={4}
                                                className="te-textarea flex-1"
                                                placeholder="Paste code example here..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCodeExample}
                                                className="te-btn-primary h-fit"
                                            >
                                                <PlusIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {formData.code_examples.map((example, index) => (
                                            <div key={index} className="te-card overflow-hidden">
                                                <div className="flex items-center justify-between bg-[var(--te-surface-alt)] text-[var(--te-text)] px-3 py-2">
                                                    <span className="text-sm font-mono">{example.language}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCodeExample(index)}
                                                        className="te-icon-btn text-red-400 hover:text-red-300"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <pre className="p-3 text-sm overflow-x-auto bg-[var(--te-surface-alt)] text-[var(--te-text)] ">
                                                    <code>{example.code}</code>
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Publishing Options */}
                                <div className="te-panel p-4">
                                    <h3 className="text-lg font-semibold text-[var(--te-text)]  mb-4">Publishing Options</h3>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={(e) => handleInputChange('is_published', e.target.checked)}
                                            className="h-4 w-4 text-[var(--te-text)] focus:ring-[var(--te-ring)] border-[var(--te-border)] rounded"
                                        />
                                        <span className="text-sm text-[var(--te-text)] ">
                                            Publish immediately (visible to all users)
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="border-t border-[var(--te-border)] px-6 py-4 bg-[var(--te-surface-alt)] bg-[var(--te-surface-alt)]">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="te-btn-secondary"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.title || !formData.category || !formData.topic}
                                    className="te-btn-primary"
                                >
                                    {isSubmitting ? 'Saving...' : (editLesson ? 'Update Lesson' : 'Create Lesson')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonCreateDSA;
