import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Coins, Zap } from "lucide-react";
import {
  HE_REDIRECT_URL,
  INITIAL_OFFER_CODE,
  getHeRedirectParams,
  isMobileNetworkCandidate,
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
  const heParams = getHeRedirectParams(INITIAL_OFFER_CODE);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 730);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

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

        <form action={HE_REDIRECT_URL} method="get">
          <input type="hidden" name="OfferCode" value={heParams.OfferCode} />
          <input type="hidden" name="redirectUrl" value={heParams.redirectUrl} />
          <input type="hidden" name="msisdn" value={heParams.msisdn} />
          <button
            type="submit"
            className="glow-on-hover home-subscribe-btn"
            onClick={(event) => {
              localStorage.setItem("offerCode", INITIAL_OFFER_CODE);
              if (!isMobileNetworkCandidate()) {
                event.preventDefault();
                navigate(
                  `/subscribe?fallback=true&offerCode=${INITIAL_OFFER_CODE}`
                );
              }
            }}
          >
            <span className="home-subscribe-btn-title">Please proceed to subscribe</span>
            <span className="home-subscribe-btn-price">GHC 1.00 per day or GHC 1.00 Daily</span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default Home;
