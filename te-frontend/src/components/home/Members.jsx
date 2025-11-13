import { useState } from 'react';
import { leadership } from './data/leadership';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Members = () => {
  const [viewAllMembers, setViewAllMembers] = useState(false);
  const displayedMembers = viewAllMembers ? leadership : leadership.slice(0, 8);

  return (
    <div id="team" className="relative bg-gradient-to-br from-white via-blue-50/20 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 py-24 sm:py-32 overflow-hidden transition-colors">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)]"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 shadow-sm mb-6">
            <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Our Team
            </span>
            <SparklesIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
            Meet the{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Visionaries
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-full opacity-60"></div>
            </span>
          </h2>
          
          <p className="text-lg md:text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A passionate collective of innovators committed to transforming lives through technology and mentorship.
          </p>
        </div>

        {/* Team grid - Elegant and minimal */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {displayedMembers.map((member, index) => (
            <div
              key={member.name}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <div className="relative h-full bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1">
                
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                
                {/* Content */}
                <div className="relative p-6 sm:p-8">
                  {/* Name - Left aligned */}
                  <h3 className="text-left text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {member.name}
                  </h3>

                  {/* LinkedIn icon with accent - Smaller and cuter */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-300 dark:from-gray-600 to-transparent"></div>
                    
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-lg shadow-sm hover:shadow-lg border border-blue-300/60 dark:border-blue-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:scale-125 hover:rotate-3 group/link"
                        aria-label={`${member.name}'s LinkedIn profile`}
                        title="Connect on LinkedIn"
                      >
                        <FontAwesomeIcon 
                          icon={faLinkedin} 
                          className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover/link:text-blue-700 dark:group-hover/link:text-blue-300 transition-colors" 
                        />
                      </a>
                    )}
                    
                    <div className="h-px flex-1 bg-gradient-to-l from-gray-300 dark:from-gray-600 to-transparent"></div>
                  </div>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent dark:from-blue-400/5 dark:via-cyan-400/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        {leadership.length > 8 && (
          <div className="text-center">
            <button
              onClick={() => setViewAllMembers(!viewAllMembers)}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/50 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105 transition-all duration-300"
            >
              <span>{viewAllMembers ? 'Show Less' : 'View All Team Members'}</span>
              <svg
                className={`h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 ${viewAllMembers ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Members;
