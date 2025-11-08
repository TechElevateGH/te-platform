import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const testimonials = [
  {
    name: 'Amara Okonkwo',
    role: 'Software Engineer at Google',
    location: 'Lagos, Nigeria',
    image: 'https://ui-avatars.com/api/?name=Amara+Okonkwo&size=128&background=3B82F6&color=fff&bold=true',
    content: 'TechElevate transformed my career journey. The mentorship and resources helped me land my dream job at Google. The community support was invaluable throughout my interview preparation.',
    rating: 5,
  },
  {
    name: 'Kwame Mensah',
    role: 'Data Scientist at Microsoft',
    location: 'Accra, Ghana',
    image: 'https://ui-avatars.com/api/?name=Kwame+Mensah&size=128&background=06B6D4&color=fff&bold=true',
    content: 'The application tracking feature kept me organized during my job search. With guidance from my mentor, I went from zero interviews to multiple offers. Forever grateful!',
    rating: 5,
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Full Stack Developer at Amazon',
    location: 'Nairobi, Kenya',
    image: 'https://ui-avatars.com/api/?name=Fatima+Ibrahim&size=128&background=8B5CF6&color=fff&bold=true',
    content: 'The learning resources on TechElevate are top-notch. From DSA workshops to system design, everything I needed was in one place. The resume reviews were game-changing.',
    rating: 5,
  },
  {
    name: 'Chibueze Nwankwo',
    role: 'Product Manager at Meta',
    location: 'Abuja, Nigeria',
    image: 'https://ui-avatars.com/api/?name=Chibueze+Nwankwo&size=128&background=10B981&color=fff&bold=true',
    content: 'As someone from a non-traditional background, I felt lost. TechElevate gave me direction, confidence, and the connections I needed to break into tech PM roles.',
    rating: 5,
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <div id="testimonials" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 py-24 sm:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-300" />
            <span className="text-sm font-semibold text-white">Success Stories</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Hear from our{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              successful mentees
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-blue-100">
            Real stories from real people who transformed their careers with TechElevate
          </p>
        </div>

        {/* Testimonial carousel */}
        <div className="relative mx-auto max-w-4xl">
          <div className="relative">
            {/* Main testimonial card */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                {/* Rating stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <StarIcon key={i} className="h-6 w-6 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl sm:text-2xl font-medium text-white leading-relaxed mb-8">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    className="h-16 w-16 rounded-full ring-4 ring-white/20"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-white text-lg">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {testimonials[currentIndex].role}
                    </div>
                    <div className="text-cyan-300 text-xs">
                      {testimonials[currentIndex].location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative quote marks */}
              <div className="absolute top-8 left-8 text-8xl text-white/10 leading-none">"</div>
              <div className="absolute bottom-8 right-8 text-8xl text-white/10 leading-none rotate-180">"</div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20 hover:scale-110"
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 hidden lg:flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20 hover:scale-110"
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Mobile navigation */}
          <div className="flex lg:hidden justify-center gap-4 mt-8">
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20"
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all duration-300 border border-white/20"
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Additional testimonials preview (desktop only) */}
        <div className="hidden xl:grid grid-cols-3 gap-6 mt-16">
          {testimonials
            .filter((_, index) => index !== currentIndex)
            .slice(0, 3)
            .map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(testimonials.indexOf(testimonial));
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full ring-2 ring-white/20"
                  />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="text-blue-200 text-xs line-clamp-1">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-sm text-blue-100 line-clamp-3 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
