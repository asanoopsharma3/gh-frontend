import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import e1 from "../product/galexy.jpeg";
import e2 from "../product/trafic.jpeg";
import e3 from "../product/speed.jpeg";
import e4 from "../product/zombee.jpeg";
import e5 from "../product/space.jpeg";
import e8 from "../product/water.jpeg";
import e9 from "../product/wwwai.jpeg";
import ninja from "../product/cube.jpeg";

export default function Product() {
  const upcomingGames = [
    { title: "Cube Ninja", img: ninja },
    { title: "Traffic Racer", img: e2 },
    { title: "Watercraft Rush", img: e8 },
    { title: "WWII Air Battle", img: e9 },
  ];

  const moreGames = [
    { title: "Galaxy Defender", img: e1 },
    { title: "Speed Rider", img: e3 },
    { title: "Zombie Attack", img: e4 },
    { title: "Space Shooter", img: e5 },
  ];
 const ismobile = window.innerWidth<700;
  return (
    <div
      className="relative min-h-screen text-white flex flex-col items-center py-10 px-4 sm:px-6 md:px-10 lg:px-20 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/leaderboard-bg.png')`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80 backdrop-blur-[1px]"></div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 mb-4 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-sm font-semibold no-underline transition hover:bg-white/15 hover:border-amber-400/50 hover:text-amber-300"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] mt-5">
            🎮 SUPERWINNINGS GAMES
          </h1>
          <p className="mt-3 text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Explore the hottest upcoming games and boost your winning streak!
          </p>
        </div>

        {/* Coming Soon */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-yellow-400 text-center sm:text-left tracking-wide mt-3 mb-3 p-3 "style={{fontSize:ismobile?"20px":"32px"}}>
            🚀 Coming Soon
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {upcomingGames.map((game, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,215,0,0.5)] cursor-pointer transform hover:-translate-y-2 transition-all duration-500 ease-out group bg-gradient-to-br from-purple-700/20 to-black/60 backdrop-blur-md shadow-[0px_0px_5px_2px_white]"
              >
                <img
                  src={game.img}
                  alt={game.title}
                  className="w-full h-52 sm:h-56 md:h-60 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 opacity-80 group-hover:opacity-90 transition duration-500"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-lg sm:text-xl drop-shadow-lg group-hover:text-yellow-300 transition">
                    {game.title}
                  </h3>
                  <p className="text-sm text-gray-300 italic opacity-0 group-hover:opacity-100 transition-all duration-500">
                    Coming Soon 🎯
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* More Games */}
        <section>
         

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 bord mt-5">
            {moreGames.map((game, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,255,0,0.4)] cursor-pointer transform hover:-translate-y-2 transition-all duration-500 ease-out group bg-gradient-to-br from-purple-800/20 to-black/50 backdrop-blur-md border-2 shadow-[0px_0px_5px_2px_white]"
              >
                <img
                  src={game.img}
                  alt={game.title}
                  className="w-full h-52 sm:h-56 md:h-60 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 opacity-80 group-hover:opacity-90 transition duration-500"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-lg sm:text-xl drop-shadow-lg group-hover:text-yellow-300 transition">
                    {game.title}
                  </h3>
                  <button className="mt-1 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-yellow-400 text-black opacity-0 group-hover:opacity-100 transition duration-500 hover:bg-yellow-300">
                    Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
