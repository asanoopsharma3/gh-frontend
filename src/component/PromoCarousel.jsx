import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Gift, Sparkles, Trophy } from "lucide-react";
import "./PromoCarousel.css";

const SLIDE_DURATION = 5500;

const PROMO_SLIDES = [
  {
    id: "daily-prize",
    badge: "Daily Prize",
    ariaText: "Play and WIN with Superwinnings and win daily prize of 250 GHC",
    icon: Gift,
    content: (
      <>
        Play &amp; WIN with <span className="promo-highlight">Superwinnings</span> and win daily
        prize of <span className="promo-highlight">250 GHC</span>
      </>
    ),
  },
  {
    id: "explore-win",
    badge: "Explore & Win",
    ariaText: "Step into the new world of Superwinnings. Play smart, win big.",
    icon: Sparkles,
    content: (
      <>
        Step into the new world of <span className="promo-highlight">Superwinnings</span> — play
        smart, win big!
      </>
    ),
  },
  {
    id: "subscribe-now",
    badge: "Join Today",
    ariaText: "Subscribe, play daily quizzes and enter the 250 GHC draw before midnight.",
    icon: Trophy,
    content: (
      <>
        Subscribe, play daily quizzes and enter the{" "}
        <span className="promo-highlight">250 GHC</span> draw before midnight!
      </>
    ),
  },
];

export default function PromoCarousel({ compact = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const goToSlide = useCallback((index) => {
    setActiveIndex((index + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;

    const timer = setInterval(goNext, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [activeIndex, isPaused, goNext, prefersReducedMotion]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const activeSlide = PROMO_SLIDES[activeIndex];
  const SlideIcon = activeSlide.icon;

  return (
    <section
      className={`promo-carousel ${compact ? "is-compact" : ""}`}
      aria-label="Promotional offers"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="promo-carousel-shell">
        <div
          className="promo-carousel-inner"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="promo-carousel-top">
            <span className="promo-carousel-badge">
              <span className="promo-live-dot" aria-hidden="true" />
              {activeSlide.badge}
            </span>

            <div className="promo-carousel-nav">
              <button
                type="button"
                className="promo-nav-btn"
                aria-label="Previous promotion"
                onClick={goPrev}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="promo-nav-btn"
                aria-label="Next promotion"
                onClick={goNext}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="promo-carousel-body">
            <div className="promo-carousel-icon-wrap" aria-hidden="true">
              <SlideIcon size={22} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                className="promo-carousel-slide"
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 28, filter: "blur(4px)" }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, x: 0, filter: "blur(0px)" }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: -28, filter: "blur(4px)" }
                }
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <p className="promo-carousel-text">{activeSlide.content}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="promo-carousel-controls">
            <div className="promo-carousel-dots" role="tablist" aria-label="Choose promotion">
              {PROMO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Promotion ${index + 1}: ${slide.badge}`}
                  className={`promo-carousel-dot ${index === activeIndex ? "is-active" : ""}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </div>

          <div className="promo-progress-track" aria-hidden="true">
            <span
              key={activeSlide.id}
              className={`promo-progress-bar ${isPaused ? "is-paused" : ""}`}
              style={{ animationDuration: `${SLIDE_DURATION}ms` }}
            />
          </div>
        </div>
      </div>

      {!compact && (
        <p className="promo-carousel-hint">
          {isPaused ? "Paused — swipe or use arrows" : "Swipe on mobile • Hover to pause"}
        </p>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {activeSlide.badge}: {activeSlide.ariaText}
      </p>
    </section>
  );
}
