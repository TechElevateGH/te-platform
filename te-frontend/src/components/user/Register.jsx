import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import {
    XCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    PhoneIcon,
    ArrowRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const Register = () => {
    const navigate = useNavigate();
    const { loginAsGuest } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Choose method, 2: Fill form

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        university: '',
        address: ''
    });

    const handleOAuthRegister = (provider) => {
        if (provider === 'Google') {
            // Redirect to backend Google OAuth endpoint
            const backendUrl = axiosInstance.defaults.baseURL;
            // Remove trailing slash if present to avoid double slashes
            const cleanUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
            window.location.href = `${cleanUrl}/auth/google/login`;
        } else {
            setError(`${provider} authentication will be implemented soon!`);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            // Register the user
            await axiosInstance.post('users', {
                email: formData.email,
                first_name: formData.firstName,
                middle_name: formData.middleName,
                last_name: formData.lastName,
                password: formData.password,
                phone_number: formData.phoneNumber,
                address: formData.address,
                university: formData.university,
            });

            // Redirect to email verification page
            navigate('/verify-email', {
                state: {
                    email: formData.email,
                    verificationType: 'registration'
                }
            });
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';

            // Check if it's a duplicate email error
            if (errorMessage.includes('already exists') || errorMessage.includes('already used')) {
                setError(errorMessage);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuestContinue = () => {
        loginAsGuest();
        setTimeout(() => {
            navigate('/workspace', { replace: true });
        }, 100);
    };

    const oauthProviders = [
        {
            name: 'Google',
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            ),
            color: 'hover:border-blue-500 hover:bg-blue-50'
        },
    ];

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-md w-full">
                    {/* Logo and header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                                <span className="text-white font-bold text-3xl">TE</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Join TechElevate
                        </h2>
                        <p className="text-gray-600">
                            Start your journey to tech excellence
                        </p>
                    </div>

                    {/* Main card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8">
                        {error && (
                            <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 animate-fade-in">
                                <div className="flex">
                                    <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                    <p className="ml-3 text-sm text-red-800">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* OAuth buttons */}
                        <div className="space-y-3 mb-6">
                            {oauthProviders.map((provider) => (
                                <button
                                    key={provider.name}
                                    type="button"
                                    onClick={() => handleOAuthRegister(provider.name)}
                                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:shadow-lg transition-all duration-300 ${provider.color}`}
                                >
                                    {provider.icon}
                                    <span>Continue with {provider.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">Or register with email</span>
                            </div>
                        </div>

                        {/* Email signup button */}
                        <button
                            onClick={() => setStep(2)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                        >
                            <EnvelopeIcon className="h-5 w-5" />
                            <span>Sign up with Email</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </button>

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handleGuestContinue}
                                className="group relative w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <span>Continue as Guest</span>
                                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Sign in link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Back to home */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Registration form
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-2xl w-full">
                {/* Back button */}
                <button
                    onClick={() => setStep(1)}
                    className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>

                {/* Main card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Create your account
                        </h2>
                        <p className="text-gray-600">
                            Fill in your details to get started
                        </p>
                        <button
                            type="button"
                            onClick={handleGuestContinue}
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <span>Continue as Guest</span>
                            <ArrowRightIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 animate-fade-in">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                    {error.includes('already exists') && (
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-500 underline"
                                        >
                                            Go to Sign In
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.middleName}
                                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="M."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                Email Address *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        {/* University */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                University *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.university}
                                onChange={(e) => handleInputChange('university', e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Your University"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                Address *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="City, Country"
                            />
                        </div>

                        {/* Password fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                    Password *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Creating account...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <CheckCircleIcon className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign in link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;