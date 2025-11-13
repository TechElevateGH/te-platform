import { useEffect, useRef } from 'react';
import { featuredCompanies } from '../../data/jobData';

const Companies = () => {
    const scrollRef = useRef(null);
    const companies = featuredCompanies;

    // Duplicate the companies array for seamless infinite scroll
    const duplicatedCompanies = [...companies, ...companies];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollPosition = 0;
        const scrollSpeed = 2; // Adjust speed here (increased for faster scrolling)
        let animationFrameId;

        const scroll = () => {
            scrollPosition += scrollSpeed;

            // Reset position for seamless loop
            if (scrollPosition >= scrollContainer.scrollWidth / 2) {
                scrollPosition = 0;
            }

            scrollContainer.scrollLeft = scrollPosition;
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        // Pause on hover
        const handleMouseEnter = () => cancelAnimationFrame(animationFrameId);
        const handleMouseLeave = () => {
            animationFrameId = requestAnimationFrame(scroll);
        };

        scrollContainer.addEventListener('mouseenter', handleMouseEnter);
        scrollContainer.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
            scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
                        Celebrate with Us
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Some of Our Wins!
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        TechElevate members have secured positions at leading tech companies worldwide,
                        from big tech to innovative startups and Fortune 500 enterprises.
                    </p>
                </div>

                {/* Auto-scrolling Companies */}
                <div className="relative">
                    {/* Gradient overlays for fade effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>

                    {/* Scrolling container */}
                    <div
                        ref={scrollRef}
                        className="flex gap-8 overflow-x-hidden py-8"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {duplicatedCompanies.map((company, index) => (
                            <div
                                key={`${company.name}-${index}`}
                                className="flex-shrink-0 group"
                            >
                                <div className="flex flex-col items-center justify-center w-44 h-28 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer p-4">
                                    {/* Company Logo */}
                                    <div className="w-16 h-16 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img
                                            src={company.logo}
                                            alt={`${company.name} logo`}
                                            className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                                            onError={(e) => {
                                                // Fallback to company name initial if logo fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        {/* Fallback initial */}
                                        <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl items-center justify-center text-white text-2xl font-bold">
                                            {company.name.charAt(0)}
                                        </div>
                                    </div>
                                    {/* Company Name */}
                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">
                                        {company.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Success Stats */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                            35+
                        </div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Top Companies
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Where our members thrive
                        </div>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            50+
                        </div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Success Stories
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Members placed in dream roles
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Companies;
