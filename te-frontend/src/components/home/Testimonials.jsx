import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import { testimonials } from '../../data/testimonials';

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
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section header */}
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 mb-4 shadow-lg shadow-cyan-500/20">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-300" />
                        <span className="text-sm font-bold text-white">Success Stories</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-xl">
                        Hear from some of our{' '}
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                            people
                        </span>
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-blue-100 font-medium">
                        Real stories from real people who transformed their careers with TechElevate
                    </p>
                </div>

                {/* Testimonial carousel */}
                <div className="relative mx-auto max-w-4xl">
                    <div className="relative">
                        {/* Main testimonial card */}
                        <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border-2 border-cyan-400/30 shadow-2xl hover:shadow-cyan-500/30 hover:border-cyan-400/50 transition-all duration-500 hover:scale-[1.02] group">
                            <div className="flex flex-col items-center text-center">
                                {/* Rating stars */}
                                <div className="flex gap-1.5 mb-8">
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className="h-7 w-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] hover:scale-125 transition-transform duration-300 cursor-pointer"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <blockquote className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-10 drop-shadow-2xl max-w-3xl">
                                    <span className="text-cyan-300 text-4xl font-serif">"</span>
                                    {testimonials[currentIndex].content}
                                    <span className="text-cyan-300 text-4xl font-serif">"</span>
                                </blockquote>

                                {/* Author */}
                                <div className="flex items-center gap-5 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 group-hover:border-cyan-400/30 transition-all duration-300">
                                    <div className="relative">
                                        <img
                                            src={testimonials[currentIndex].image}
                                            alt={testimonials[currentIndex].name}
                                            className="h-20 w-20 rounded-full ring-4 ring-cyan-400/40 hover:ring-cyan-400/70 transition-all duration-300 hover:scale-110 shadow-xl"
                                        />
                                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white/20 shadow-lg"></div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white text-xl drop-shadow-lg mb-1">
                                            {testimonials[currentIndex].name}
                                        </div>
                                        <div className="text-cyan-300 text-sm font-semibold mb-1">
                                            {testimonials[currentIndex].role}
                                        </div>
                                        <div className="text-blue-200 text-xs font-medium flex items-center gap-1">
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            {testimonials[currentIndex].location}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute top-6 left-6 text-9xl text-cyan-400/10 leading-none font-serif">"</div>
                            <div className="absolute bottom-6 right-6 text-9xl text-cyan-400/10 leading-none rotate-180 font-serif">"</div>

                            {/* Animated border gradient */}
                            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-purple-500/30 -z-10 blur-2xl animate-pulse"></div>

                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-3xl"></div>
                            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400/50 rounded-br-3xl"></div>
                        </div>

                        {/* Navigation buttons */}
                        <button
                            onClick={goToPrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 hidden lg:flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md hover:from-cyan-500/40 hover:to-blue-500/40 rounded-full transition-all duration-300 border-2 border-cyan-400/30 hover:border-cyan-400/60 hover:scale-125 hover:shadow-2xl hover:shadow-cyan-500/40 group"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeftIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 hidden lg:flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md hover:from-cyan-500/40 hover:to-blue-500/40 rounded-full transition-all duration-300 border-2 border-cyan-400/30 hover:border-cyan-400/60 hover:scale-125 hover:shadow-2xl hover:shadow-cyan-500/40 group"
                            aria-label="Next testimonial"
                        >
                            <ChevronRightIcon className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Mobile navigation */}
                    <div className="flex lg:hidden justify-center gap-4 mt-10">
                        <button
                            onClick={goToPrevious}
                            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md hover:from-cyan-500/40 hover:to-blue-500/40 rounded-full transition-all duration-300 border-2 border-cyan-400/30 hover:border-cyan-400/60 hover:scale-110 shadow-lg"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeftIcon className="h-6 w-6 text-white" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md hover:from-cyan-500/40 hover:to-blue-500/40 rounded-full transition-all duration-300 border-2 border-cyan-400/30 hover:border-cyan-400/60 hover:scale-110 shadow-lg"
                            aria-label="Next testimonial"
                        >
                            <ChevronRightIcon className="h-6 w-6 text-white" />
                        </button>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2.5 mt-10">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setIsAutoPlaying(false);
                                    setCurrentIndex(index);
                                }}
                                className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'w-10 bg-gradient-to-r from-cyan-400 to-blue-400 shadow-lg shadow-cyan-400/60 scale-110'
                                    : 'w-2.5 bg-white/30 hover:bg-cyan-300 hover:scale-125 hover:shadow-md hover:shadow-cyan-300/50'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Additional testimonials preview (desktop only) */}
                <div className="hidden xl:grid grid-cols-3 gap-6 mt-20">
                    {testimonials
                        .filter((_, index) => index !== currentIndex)
                        .slice(0, 3)
                        .map((testimonial, index) => (
                            <div
                                key={index}
                                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border-2 border-white/10 hover:border-cyan-400/50 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
                                onClick={() => {
                                    setIsAutoPlaying(false);
                                    setCurrentIndex(testimonials.indexOf(testimonial));
                                }}
                            >
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 -z-10"></div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="h-14 w-14 rounded-full ring-2 ring-white/20 group-hover:ring-4 group-hover:ring-cyan-400/60 transition-all duration-300 group-hover:scale-110 shadow-lg"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white/20 shadow-md"></div>
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors duration-300 drop-shadow-md">{testimonial.name}</div>
                                        <div className="text-blue-200 text-xs line-clamp-1 group-hover:text-cyan-200 transition-colors duration-300 font-medium">{testimonial.role}</div>
                                    </div>
                                </div>

                                {/* Star rating */}
                                <div className="flex gap-0.5 mb-3">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <StarIcon key={i} className="h-4 w-4 text-yellow-400 drop-shadow-md" />
                                    ))}
                                </div>

                                <p className="text-sm text-blue-100 line-clamp-3 leading-relaxed group-hover:text-white transition-colors duration-300 font-medium">
                                    "{testimonial.content}"
                                </p>

                                {/* Corner accent */}
                                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Testimonials;
