import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  INITIAL_OFFER_CODE,
  isMobileNetworkCandidate,
  startHeSubscription,
} from "../config/subscription";

function Home() {
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  const [hours, setHours] = useState("00");
  const [mint, setMint] = useState("00");
  const [second, setSecond] = useState("00");

  // Detect mobile
  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 730);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // ---------- SWAZILAND TIMER ----------
  useEffect(() => {
    const interval = setInterval(() => {
      // GET CURRENT TIME IN SWAZILAND
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Africa/Mbabane" })
      );

      // SET TARGET AS MIDNIGHT (24:00) IN SWAZILAND
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);

      const diff = tomorrow - now;

      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
      const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");

      setHours(h);
      setMint(m);
      setSecond(s);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribeClick = () => {
    if (isMobileNetworkCandidate()) {
      startHeSubscription(INITIAL_OFFER_CODE);
      return;
    }

    navigate(`/subscribe?fallback=true&offerCode=${INITIAL_OFFER_CODE}`);
  };

  return (
    <div
      className={`${
        isMobile
          ? "flex flex-col items-center text-white px-4 text-center min-h-screen mt-4"
          : "flex flex-col items-center justify-center h-[100vh] text-center text-white opacity-75 px-4"
      }`}
    >
      {isMobile ? (
        <div className="h-[350px] w-full flex flex-col justify-center gap-3 items-center">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-xl lg:text-6xl">
              <span>EXPLORE & WIN</span>
            </h3>
            <h3 className="text-lg md:text-xl lg:text-2xl">THE NEW WORLD OF</h3>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              SUPERWINNINGS!!
            </h1>
          </div>
          <button
            className="glow-on-hover mt-6 px-6 py-2 bg-yellow-500 rounded-lg text-white font-semibold hover:bg-yellow-400 transition"
            onClick={handleSubscribeClick}
          >
            PLEASE PROCEED TO SUBSCRIBE
          </button>
        </div>
      ) : (
        <>
          <div className="w-[45%] mb-3 text-center">
            <h1
              className="uppercase text-10xl tracking-wider h-[50px] mb-4"
              style={{ wordSpacing: "6px", fontSize: "70px" }}
            >
              explore & win
            </h1>
            <h3 className="md:text-[20px] lg:text-2xl">
              THE NEW WORLD OF{" "}
              <span className="uppercase font-bold">SUPERWINNINGS !!</span>
            </h3>
          </div>

          <button
            className="glow-on-hover mt-6 px-6 py-2 bg-yellow-500 rounded-lg text-white font-semibold hover:bg-yellow-400 transition"
            onClick={handleSubscribeClick}
          >
            PLEASE PROCEED TO SUBSCRIBE
          </button>
        </>
      )}

      {/* ------------------- TIMER SECTION ------------------- */}
      <div className="relative bottom-0 left-0 top-20 w-full  py-2 flex flex-col items-center gap-4">

  <p className="text-3xl font-boldtext-lg font-semibold tracking-wide 
  bg-gradient-to-r from-blue-400 to-pink-500 
  text-transparent bg-clip-text drop-shadow-[0_0_6px_#ff3bd240]">
    Hours Left For DRAW
  </p>

  <div className="flex justify-center gap-6">

    <div className=" glow-on-hover w-24 h-24 bg-[#0f0f0f] rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_#00ffbf40]">
      <p className="text-3xl font-boldtext-lg font-semibold tracking-wide 
  bg-gradient-to-r from-blue-400 to-pink-500 
  text-transparent bg-clip-text drop-shadow-[0_0_6px_#ff3bd240]">
        {hours}
      </p>
      <p className="text-gray-300 text-sm">Hours</p>
    </div>

    <div className=" glow-on-hover w-24 h-24  rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_#00ffbf40]">
      <p className="text-3xl font-boldtext-lg font-semibold tracking-wide 
  bg-gradient-to-r from-blue-400 to-pink-500 
  text-transparent bg-clip-text drop-shadow-[0_0_6px_#ff3bd240]">
        {mint}
      </p>
      <p className="text-gray-300 text-sm">Minutes</p>
    </div>

    <div className=" glow-on-hover w-24 h-24 bg-[#0f0f0f] rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_#00ffbf40]">
      <p className="text-3xl font-boldtext-lg font-semibold tracking-wide 
  bg-gradient-to-r from-blue-400 to-pink-500 
  text-transparent bg-clip-text drop-shadow-[0_0_6px_#ff3bd240]">
        {second}
      </p>
      <p className="text-gray-300 text-sm">Seconds</p>
    </div>

  </div>
</div>

    </div>
  );
}

export default Home;
