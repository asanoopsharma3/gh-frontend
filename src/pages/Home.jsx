import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Brain, Coins, Zap } from "lucide-react";
import {
  INITIAL_OFFER_CODE,
  LOCAL_SUBSCRIPTION_ENABLED,
  isMobileNetworkCandidate,
  startHeSubscription,
} from "../config/subscription";
import PromoCarousel from "../component/PromoCarousel";
import "./home.css";

const HOME_PERKS = [
  { icon: Coins, label: "250 GHC Daily" },
  { icon: Brain, label: "Quiz & Win" },
  { icon: Zap, label: "Instant Play" },
];

function Home() {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 730);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const handleSubscribeClick = () => {
    if (LOCAL_SUBSCRIPTION_ENABLED) {
      navigate(`/subscribe?fallback=true&offerCode=${INITIAL_OFFER_CODE}`);
      return;
    }

    if (isMobileNetworkCandidate()) {
      startHeSubscription(INITIAL_OFFER_CODE);
      return;
    }

    navigate(`/subscribe?fallback=true&offerCode=${INITIAL_OFFER_CODE}`);
  };

  return (
    <div className={`home-page ${isMobile ? "is-mobile" : "is-desktop"}`}>
      <PromoCarousel compact />

      <div className="home-perks" aria-label="Key benefits">
        {HOME_PERKS.map(({ icon: Icon, label }) => (
          <span key={label} className="home-perk">
            <Icon size={14} />
            {label}
          </span>
        ))}
      </div>

      <section className="home-hero">
        {isMobile ? (
          <>
            <h2 className="home-hero-title">
              <span>Explore &amp; Win</span>
            </h2>
            <p className="home-hero-subtitle">The new world of</p>
            <h1 className="home-hero-brand">Superwinnings!!</h1>
          </>
        ) : (
          <>
            <h1 className="home-hero-brand-desktop">explore &amp; win</h1>
            <p className="home-hero-subtitle">
              The new world of <strong>SUPERWINNINGS !!</strong>
            </p>
          </>
        )}

        <button
          type="button"
          className="glow-on-hover home-subscribe-btn"
          onClick={handleSubscribeClick}
        >
          <span className="home-subscribe-btn-title">Please proceed to subscribe</span>
          <span className="home-subscribe-btn-price">GHC 1.00 per day or GHC 1.00 Daily</span>
        </button>
      </section>
    </div>
  );
}

export default Home;
