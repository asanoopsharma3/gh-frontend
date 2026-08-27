import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Brain, Coins, Zap } from "lucide-react";
import {
  INITIAL_OFFER_CODE,
  isMobileDevice,
  isMobileNetworkCandidate,
  startHeSubscription,
} from "../config/subscription";
import PromoCarousel from "../component/PromoCarousel";
import "./Home.css";

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
    if (isMobile || isMobileNetworkCandidate() || isMobileDevice()) {
      localStorage.setItem("offerCode", INITIAL_OFFER_CODE);
      startHeSubscription(INITIAL_OFFER_CODE);
      return;
    }

    navigate("/subscribe?fallback=true");
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

        <p className="home-terms-note">
          By clicking Subscribe Now, you agree to our{" "}
          <Link to="/terms" className="home-terms-link">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

export default Home;
