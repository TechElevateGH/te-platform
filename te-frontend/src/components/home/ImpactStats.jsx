import { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  TrophyIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { ChartBarIcon } from '@heroicons/react/24/solid';

const stats = [
  {
    id: 1,
    name: 'Active Mentees',
    value: 500,
    suffix: '+',
    icon: UserGroupIcon,
    color: 'from-blue-500 to-cyan-500',
    description: 'Students and professionals in our program',
  },
  {
    id: 2,
    name: 'Success Stories',
    value: 250,
    suffix: '+',
    icon: TrophyIcon,
    color: 'from-purple-500 to-pink-500',
    description: 'Mentees who landed their dream jobs',
  },
  {
    id: 3,
    name: 'Partner Companies',
    value: 50,
    suffix: '+',
    icon: BriefcaseIcon,
    color: 'from-green-500 to-emerald-500',
    description: 'Tech companies offering opportunities',
  },
  {
    id: 4,
    name: 'Countries Reached',
    value: 30,
    suffix: '+',
    icon: GlobeAltIcon,
    color: 'from-orange-500 to-red-500',
    description: 'Global presence across continents',
  },
  {
    id: 5,
    name: 'Learning Resources',
    value: 200,
    suffix: '+',
    icon: AcademicCapIcon,
    color: 'from-cyan-500 to-blue-500',
    description: 'Workshops, courses, and tutorials',
  },
  {
    id: 6,
    name: 'Community Members',
    value: 1000,
    suffix: '+',
    icon: HeartIcon,
    color: 'from-rose-500 to-pink-500',
    description: 'Active community participants',
  },
];

const AnimatedNumber = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      setCount(Math.floor(value * percentage));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
};

const ImpactStats = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('impact');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <div id="impact" className="relative bg-white py-24 sm:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 mb-4">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Our Impact</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Making a{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              real difference
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our platform has empowered thousands of talented individuals to achieve their dreams in the tech industry.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-full bg-white rounded-3xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden p-8 hover:-translate-y-2">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>

                {/* Number */}
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {isVisible && <AnimatedNumber value={stat.value} />}
                  {stat.suffix}
                </div>

                {/* Label */}
                <div className="text-xl font-semibold text-gray-900 mb-2">
                  {stat.name}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {stat.description}
                </p>

                {/* Decorative gradient border */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.color} -z-10 blur-2xl`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col gap-4">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These numbers represent <span className="font-semibold text-gray-900">real people</span> with 
              <span className="font-semibold text-gray-900"> real dreams</span> who found their path through TechElevate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                Be Part of Our Impact
              </button>
              <span className="text-sm text-gray-500">Join us in changing lives</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactStats;
