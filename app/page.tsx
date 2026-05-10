"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "./src/lib/supabase";

export default function Home() {
  const [video, setVideo] = useState("");
  const [videoSide, setVideoSide] = useState("");
  const [gooned, setGooned] = useState(0);
  const [notGooned, setNotGooned] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    { country: string; count: number }[]
  >([]);
  const [lastClickEffect, setLastClickEffect] = useState<{ side: string; x: number; y: number } | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    fetchCounts();
    fetchLeaderboard();

    const channel = supabase
      .channel("clicks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clicks",
        },
        () => {
          fetchCounts();
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCounts() {
    const { data } = await supabase.from("clicks").select("side");

    const goonedCount =
      data?.filter((x) => x.side === "gooned").length || 0;

    const notGoonedCount =
      data?.filter((x) => x.side === "not_gooned").length || 0;

    setGooned(goonedCount);
    setNotGooned(notGoonedCount);
  }

  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from("clicks")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    if (!data) return;

    const grouped: Record<string, number> = {};

    data.forEach((item) => {
      const country = item.country;

      if (!country || country === "Unknown") return;

      grouped[country] = (grouped[country] || 0) + 1;
    });

    const sorted = Object.entries(grouped)
      .map(([country, count]) => ({
        country,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    setLeaderboard(sorted);
  }

  async function vote(side: string, event?: React.MouseEvent) {
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setLastClickEffect({ side, x, y });
      setTimeout(() => setLastClickEffect(null), 400);
    }

    setShake(true);
    setTimeout(() => setShake(false), 200);

    setVideoSide(side);

    if (side === "gooned") {
      setVideo("/videos/gooned.mp4");
    } else {
      setVideo("/videos/notgooned.mp4");
    }

    setTimeout(() => {
      setVideo("");
    }, 2800);

    let country = "Unknown";

    try {
      const res = await fetch("https://ipapi.co/json/");

      if (res.ok) {
        const geo = await res.json();
        country = geo.country_name || "Unknown";
      }
    } catch (e) {
      console.log("Geo lookup failed");
    }

    try {
      await supabase.from("clicks").insert({
        side,
        country,
      });

      fetchCounts();
    } catch (err) {
      console.error(err);
    }
  }

  const total = gooned + notGooned;
  const goonedPercent = total > 0 ? ((gooned / total) * 100).toFixed(1) : 0;
  const notGoonedPercent = total > 0 ? ((notGooned / total) * 100).toFixed(1) : 0;

  const winnerMessage =
    gooned > notGooned
      ? { text: "GOONERS ARE WINNING", color: "from-red-600 to-red-800", emoji: "💀" }
      : notGooned > gooned
      ? { text: "HUMANITY IS HEALING 🗿", color: "from-green-600 to-green-800", emoji: "🌿" }
      : { text: "BALANCED CHAOS ⚖️", color: "from-purple-600 to-indigo-800", emoji: "🌀" };

  const winningLead = Math.abs(gooned - notGooned);
  const isGoonedWinning = gooned > notGooned;

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white overflow-hidden font-sans">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,0,100,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,255,150,0.05),transparent_60%)] pointer-events-none" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              background: i % 2 === 0 ? "#ff3366" : "#33ff66",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animationDelay: Math.random() * 5 + "s",
              animationDuration: Math.random() * 8 + 4 + "s",
            }}
          />
        ))}
      </div>

      {/* Header Section - Enhanced */}
      <div className="relative z-20 text-center pt-6 pb-4 px-4 bg-gradient-to-b from-black/80 via-black/50 to-transparent backdrop-blur-md border-b border-white/10">
        {/* <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
          🧠 AWARENESS WARS 🧠
        </h1> */}
        <div className={`mt-2 inline-block px-6 py-2 rounded-full bg-gradient-to-r ${winnerMessage.color} shadow-lg transform transition-all duration-300`}>
          <span className="text-xl md:text-2xl font-bold tracking-wide">
            {winnerMessage.emoji} {winnerMessage.text} {winnerMessage.emoji}
          </span>
        </div>
        
        {/* Stats Row - SCROLLABLE ON MOBILE */}
        <div className="relative mt-4">
          {/* Gradient fade hints for scrolling on mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 to-transparent z-10 pointer-events-none md:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/60 to-transparent z-10 pointer-events-none md:hidden" />
          
          <div className="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-red-500/50 pb-2 -mx-2 px-2">
            <div className="flex justify-start md:justify-center gap-3 text-sm md:text-base min-w-max md:min-w-0">
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-red-500/30 shrink-0">
                <span className="font-mono font-bold text-red-400">🔥 GOONED</span>
                <span className="ml-2 font-black text-white">{goonedPercent}%</span>
              </div>
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-green-500/30 shrink-0">
                <span className="font-mono font-bold text-green-400">💚 NOT GOONED</span>
                <span className="ml-2 font-black text-white">{notGoonedPercent}%</span>
              </div>
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-yellow-500/30 shrink-0">
                <span className="font-mono font-bold text-yellow-400">📊 TOTAL</span>
                <span className="ml-2 font-black text-white">{total.toLocaleString()}</span>
              </div>
              {winningLead > 0 && (
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-blue-500/30 shrink-0">
                  <span className="font-mono font-bold text-blue-400">⚡ LEAD BY</span>
                  <span className="ml-2 font-black text-white">{winningLead.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out"
            style={{ width: `${goonedPercent}%` }}
          />
        </div>
      </div>

      {/* Main Click Area - Split Screen with GLASS FX */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-200px)]">
        {/* GOONED BUTTON SIDE */}
        <button
          onClick={(e) => vote("gooned", e)}
          className={`group relative flex-1 flex flex-col items-center justify-center transition-all duration-300 ${
            shake ? "animate-[shake_0.1s_ease-in-out_0s_2]" : ""
          }`}
          style={{
            background: "linear-gradient(135deg, rgba(180, 30, 50, 0.9) 0%, rgba(120, 10, 30, 0.95) 100%)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Ripple Effect */}
          {lastClickEffect?.side === "gooned" && (
            <div
              className="absolute w-32 h-32 rounded-full bg-white/30 animate-ping pointer-events-none"
              style={{
                left: lastClickEffect.x - 64,
                top: lastClickEffect.y - 64,
              }}
            />
          )}

          <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-200">
            <div className="text-7xl md:text-8xl font-black mb-4 drop-shadow-2xl">💀</div>
            <div className="text-5xl md:text-7xl font-black tracking-wider uppercase bg-gradient-to-r from-red-300 to-red-100 bg-clip-text text-transparent">
              GOONED
            </div>
            <div className="text-6xl md:text-7xl font-bold mt-6 font-mono bg-black/30 backdrop-blur-sm px-8 py-3 rounded-2xl inline-block border border-red-400/30">
              {gooned.toLocaleString()}
            </div>
            <p className="mt-6 text-red-200 text-sm uppercase tracking-wider opacity-80 group-hover:opacity-100">
              😈 click to embrace chaos 😈
            </p>
          </div>

          {/* Meme video overlay for gooned */}
          {video && videoSide === "gooned" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-2xl blur-2xl" />
                <video
                  src={video}
                  autoPlay
                  muted
                  className="relative w-[90vw] max-w-md md:max-w-lg rounded-2xl shadow-2xl border-4 border-red-500 ring-4 ring-red-500/50 object-cover"
                  style={{ boxShadow: "0 0 50px rgba(255,0,0,0.5)" }}
                />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce">
                  🔥 GOONED MOMENT 🔥
                </div>
              </div>
            </div>
          )}
        </button>

        {/* NOT GOONED BUTTON SIDE */}
        <button
          onClick={(e) => vote("not_gooned", e)}
          className={`group relative flex-1 flex flex-col items-center justify-center transition-all duration-300 ${
            shake ? "animate-[shake_0.1s_ease-in-out_0s_2]" : ""
          }`}
          style={{
            background: "linear-gradient(135deg, rgba(30, 120, 60, 0.9) 0%, rgba(10, 70, 30, 0.95) 100%)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {lastClickEffect?.side === "not_gooned" && (
            <div
              className="absolute w-32 h-32 rounded-full bg-white/30 animate-ping pointer-events-none"
              style={{
                left: lastClickEffect.x - 64,
                top: lastClickEffect.y - 64,
              }}
            />
          )}

          <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-200">
            <div className="text-7xl md:text-8xl font-black mb-4 drop-shadow-2xl">🧘</div>
            <div className="text-5xl md:text-7xl font-black tracking-wider uppercase bg-gradient-to-r from-green-300 to-emerald-100 bg-clip-text text-transparent">
              NOT GOONED
            </div>
            <div className="text-6xl md:text-7xl font-bold mt-6 font-mono bg-black/30 backdrop-blur-sm px-8 py-3 rounded-2xl inline-block border border-green-400/30">
              {notGooned.toLocaleString()}
            </div>
            <p className="mt-6 text-green-200 text-sm uppercase tracking-wider opacity-80 group-hover:opacity-100">
              🗿 sigma enlightenment 🗿
            </p>
          </div>

          {/* Sigma edit clip overlay for not gooned */}
          {video && videoSide === "not_gooned" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-2xl" />
                <video
                  src={video}
                  autoPlay
                  muted
                  className="relative w-[90vw] max-w-md md:max-w-lg rounded-2xl shadow-2xl border-4 border-green-500 ring-4 ring-green-500/50 object-cover"
                  style={{ boxShadow: "0 0 50px rgba(0,255,100,0.5)" }}
                />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce">
                  🗿 THE GOAT
                </div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Leaderboard Section - Sticky but modern */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-md border-t border-white/10 py-5 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              🌍 GLOBAL LEADERBOARD 🌍
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white font-mono">TOP 10 NATIONS</span>
            </h2>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              live updates
            </div>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic">waiting for first click 👀</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {leaderboard.slice(0, 10).map((item, index) => {
                const medaled = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
                return (
                  <div
                    key={item.country}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all duration-200 border border-white/5 hover:border-white/20 backdrop-blur-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-gray-400 w-8">{index + 1}</span>
                      <span className="font-bold text-base group-hover:text-yellow-300 transition">
                        {medaled && <span className="mr-1">{medaled}</span>}
                        {item.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black text-yellow-400">{item.count.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">clicks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Total countries hint */}
          {leaderboard.length > 0 && (
            <div className="mt-3 text-center text-xs text-gray-500">
              {leaderboard.length} countries participating • every click counts toward awareness
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 0s 2;
        }
        /* Custom scrollbar styling for the stats row */
        .scrollbar-thin::-webkit-scrollbar {
          height: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.8);
        }
      `}</style>
    </main>
  );
}