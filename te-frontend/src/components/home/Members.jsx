import { useState } from 'react';
import { leadership } from './data/leadership';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Members = () => {
  const [viewAllMembers, setViewAllMembers] = useState(false);
  const displayedMembers = viewAllMembers ? leadership : leadership.slice(0, 4);

  return (
    <div id="team" className="relative bg-gradient-to-br from-gray-50 via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 py-24 sm:py-32 overflow-hidden transition-colors">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 -translate-x-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-500/30 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 right-0 translate-x-1/2 w-96 h-96 bg-cyan-200 dark:bg-cyan-500/30 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-100 dark:border-gray-700 shadow-sm mb-4">
            <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Our Team</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Meet Our{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Leadership
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Passionate professionals dedicated to empowering the next generation of tech talent from diverse backgrounds.
          </p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {displayedMembers.map((member, index) => (
            <div
              key={member.name}
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-full bg-white dark:bg-gray-800 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 hover:-translate-y-2">
                {/* Image container */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=256&background=3B82F6&color=fff&bold=true`;
                    }}
                  />

                  {/* Social links overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110"
                      >
                        <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-300 hover:scale-110"
                      >
                        <FontAwesomeIcon icon={faGithub} className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {member.role}
                  </p>

                  {/* Accent bar */}
                  <div className="mt-4 h-1 w-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 dark:from-blue-400/10 to-transparent rounded-bl-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        {leadership.length > 4 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setViewAllMembers(!viewAllMembers)}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-full shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transform hover:scale-105 transition-all duration-300"
            >
              <span>{viewAllMembers ? 'Show Less' : 'View All Team Members'}</span>
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${viewAllMembers ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Join team CTA */}
        <div className="mt-20 mx-auto max-w-3xl">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 sm:p-12 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative text-center">
              <SparklesIcon className="h-12 w-12 text-white/80 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-4">
                Want to Join Our Team?
              </h3>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                We're always looking for passionate individuals who want to make a difference in tech education and mentorship.
              </p>
              <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-gray-50">
                Get Involved
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
