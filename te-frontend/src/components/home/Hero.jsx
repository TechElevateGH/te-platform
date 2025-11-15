import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  SparklesIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const floatingIcons = [
    { Icon: SparklesIcon, delay: '0s', position: 'top-20 left-[10%]' },
    { Icon: RocketLaunchIcon, delay: '0.5s', position: 'top-40 right-[15%]' },
    { Icon: AcademicCapIcon, delay: '1s', position: 'top-[60%] left-[8%]' },
    { Icon: UserGroupIcon, delay: '1.5s', position: 'top-[70%] right-[12%]' },
    { Icon: ChartBarIcon, delay: '2s', position: 'top-[45%] right-[8%]' },
    { Icon: GlobeAltIcon, delay: '2.5s', position: 'top-32 left-[20%]' },
  ];

  return (
    <div id="home" className='relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors'>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating icons */}
      {floatingIcons.map((item, idx) => (
        <div
          key={idx}
          className={`hidden lg:block absolute ${item.position} animate-float opacity-30 dark:opacity-20`}
          style={{
            animationDelay: item.delay,
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        >
          <item.Icon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
        </div>
      ))}

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40'>
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-blue-100 dark:border-gray-700 mb-6 sm:mb-8 animate-fade-in-down">
            <SparklesIcon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Empowering the Next Generation
            </span>
          </div>

          {/* Main heading */}
          <h1 className="mx-auto max-w-5xl font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-gray-900 dark:text-white animate-fade-in-up">
            Unlock Your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Tech Potential
              </span>
              <svg
                className="absolute left-0 top-full w-full h-2 sm:h-3 -mt-1 sm:-mt-2"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C50 2 100 2 150 6C200 10 250 8 298 4"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-draw"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 sm:mt-8 max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 dark:text-gray-300 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            Breaking barriers and building bridges to tech excellence. We connect aspiring developers from
            <span className="font-semibold text-gray-900 dark:text-white"> Africa and beyond</span> with world-class
            <span className="font-semibold text-gray-900 dark:text-white"> mentorship</span>,
            <span className="font-semibold text-gray-900 dark:text-white"> cutting-edge resources</span>, and
            <span className="font-semibold text-gray-900 dark:text-white"> life-changing opportunities.</span>
          </p>

          {/* CTA / Auth-aware Buttons */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 font-semibold rounded-full shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-sm sm:text-base">Already a Member?</span>
                    <svg className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-sm sm:text-base">Get Started Free</span>
                    <RocketLaunchIcon className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </>
            )}
            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/workspace')}
                  className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500/90 to-blue-500/90 backdrop-blur-md text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden border border-white/20"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-sm sm:text-base">Go to Workspace</span>
                    <RocketLaunchIcon className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-blue-600/90 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 font-semibold rounded-full shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-sm sm:text-base">Explore Features</span>
                    <svg className="h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 animate-scroll"></div>
        </div>
      </div>
    </div>
  )
}

export default Hero;