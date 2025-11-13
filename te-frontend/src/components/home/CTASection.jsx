import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    RocketLaunchIcon,
    SparklesIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const CTASection = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 py-24 sm:py-32 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }}></div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 sm:mb-8 animate-fade-in-down">
                        <SparklesIcon className="h-4 sm:h-5 w-4 sm:w-5 text-cyan-300" />
                        <span className="text-xs sm:text-sm font-semibold text-white">Start Your Journey Today</span>
                    </div>

                    {/* Main heading */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6 animate-fade-in-up">
                        Ready to{' '}
                        <span className="relative inline-block">
                            <span className="relative z-10 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Transform Your Future?
                            </span>
                            <svg
                                className="absolute left-0 top-full w-full h-2 sm:h-3 -mt-1"
                                viewBox="0 0 300 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 10C50 2 100 2 150 6C200 10 250 8 298 4"
                                    stroke="url(#cta-gradient)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="cta-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#06B6D4" />
                                        <stop offset="50%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </span>
                    </h2>

                    {/* Description */}
                    <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-12 leading-relaxed animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
                        Join hundreds of talented individuals who have launched successful careers in tech.
                        Get personalized mentorship, access exclusive resources, and connect with opportunities
                        at top companies around the world.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12 animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
                        {!isAuthenticated && (
                            <>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto group relative px-8 sm:px-10 py-4 sm:py-5 bg-white text-blue-900 font-bold text-base sm:text-lg rounded-full shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                                        <span>Get Started Free</span>
                                        <RocketLaunchIcon className="h-5 sm:h-6 w-5 sm:w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </button>

                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full sm:w-auto group px-8 sm:px-10 py-4 sm:py-5 bg-white/10 backdrop-blur-sm text-white font-bold text-base sm:text-lg rounded-full shadow-xl hover:bg-white/20 border border-white/30 hover:border-white/50 transform hover:scale-105 transition-all duration-300"
                                >
                                    <span className="flex items-center justify-center gap-2 sm:gap-3">
                                        <span>Log In</span>
                                        <ArrowRightIcon className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={() => navigate('/workspace')}
                                className="w-full sm:w-auto group relative px-8 sm:px-10 py-4 sm:py-5 bg-white text-blue-900 font-bold text-base sm:text-lg rounded-full shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transform hover:scale-105 transition-all duration-300 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                                    <span>Go to Workspace</span>
                                    <RocketLaunchIcon className="h-5 sm:h-6 w-5 sm:w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            </button>
                        )}
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-white/80 text-xs sm:text-sm animate-fade-in px-4" style={{ animationDelay: '0.6s' }}>
                        <div className="flex items-center gap-2">
                            <svg className="h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>100% Free</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="whitespace-nowrap">No Credit Card Required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Instant Access</span>
                        </div>
                    </div>
                </div>

                {/* Bottom decorative elements */}
                <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto opacity-70">
                    {[
                        { label: 'Expert Mentors', value: '50+' },
                        { label: 'Resources', value: '200+' },
                        { label: 'Success Rate', value: '95%' },
                        { label: 'Avg. Response', value: '24h' },
                    ].map((item, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 mb-1">{item.value}</div>
                            <div className="text-xs sm:text-sm text-blue-200">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CTASection;
