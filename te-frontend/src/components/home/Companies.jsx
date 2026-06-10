import { useCallback, useEffect, useRef, useState } from "react";
import { featuredCompanies } from "../../data/jobData";

const CompanyLogo = ({ company }) => {
  const [imgStatus, setImgStatus] = useState("loading"); // 'loading' | 'loaded' | 'error'

  const handleLoad = useCallback(() => setImgStatus("loaded"), []);
  const handleError = useCallback(() => setImgStatus("error"), []);

  return (
    <div className="w-11 h-11 mb-2 flex items-center justify-center">
      {imgStatus !== "error" && (
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className={`w-full h-full object-contain rounded-md grayscale transition-opacity duration-300 ${
            imgStatus === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      {imgStatus !== "loaded" && (
        <div
          className={`${imgStatus === "loading" ? "absolute" : ""} w-full h-full rounded-md border border-[var(--te-border)] bg-[var(--te-surface-alt)] flex items-center justify-center font-mono text-base font-bold text-[var(--te-text)]`}
        >
          {company.name.charAt(0)}
        </div>
      )}
    </div>
  );
};

const Companies = () => {
  const scrollRef = useRef(null);
  const companies = featuredCompanies;

  // Duplicate the companies array for seamless infinite scroll
  const duplicatedCompanies = [...companies, ...companies];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 1.2;
    let animationFrameId;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => cancelAnimationFrame(animationFrameId);
    const handleMouseLeave = () => {
      animationFrameId = requestAnimationFrame(scroll);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section className="py-24 bg-[var(--te-bg)] border-b border-[var(--te-border)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <span className="te-eyebrow">{'// outcomes'}</span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--te-text)]">
            Where our members landed
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--te-text-dim)]">
            From big tech to fast-growing startups and Fortune 500 enterprises — our
            members ship their careers to leading companies worldwide.
          </p>
        </div>

        {/* Auto-scrolling Companies */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--te-bg)] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--te-bg)] to-transparent z-10 pointer-events-none"></div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden py-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {duplicatedCompanies.map((company, index) => (
              <div key={`${company.name}-${index}`} className="flex-shrink-0">
                <div className="flex flex-col items-center justify-center w-40 h-24 te-card transition-colors hover:bg-[var(--te-hover)] p-4">
                  <CompanyLogo company={company} />
                  <div className="font-mono text-[11px] text-[var(--te-text-dim)] text-center">
                    {company.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Stats */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] max-w-2xl">
          <div className="bg-[var(--te-surface)] p-6 text-center">
            <div className="font-mono text-4xl font-bold text-te-green">35+</div>
            <div className="mt-1 text-sm font-semibold text-[var(--te-text)]">Top Companies</div>
            <div className="mt-0.5 text-xs text-[var(--te-text-dim)]">Where our members thrive</div>
          </div>
          <div className="bg-[var(--te-surface)] p-6 text-center">
            <div className="font-mono text-4xl font-bold text-te-gold">50+</div>
            <div className="mt-1 text-sm font-semibold text-[var(--te-text)]">Success Stories</div>
            <div className="mt-0.5 text-xs text-[var(--te-text-dim)]">Members placed in dream roles</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Companies;
