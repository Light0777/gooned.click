"use client";

import { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function Home() {
  const [gooned, setGooned] = useState(0);
  const [notGooned, setNotGooned] = useState(0);

  async function fetchCounts() {
    const { data } = await supabase.from("clicks").select("side");

    const goonedCount =
      data?.filter((x) => x.side === "gooned").length || 0;

    const notGoonedCount =
      data?.filter((x) => x.side === "not_gooned").length || 0;

    setGooned(goonedCount);
    setNotGooned(notGoonedCount);
  }

  async function vote(side: string) {
    await supabase.from("clicks").insert({ side });

    fetchCounts();
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <main className="grid sm:flex h-screen bg-black text-white">
      <button
        onClick={() => vote("gooned")}
        className="flex-1 text-4xl font-bold bg-red-700 hover:bg-red-600 transition"
      >
        GOONED
        <div className="text-2xl mt-4">{gooned}</div>
      </button>
      <button
        onClick={() => vote("not_gooned")}
        className="flex-1 text-4xl font-bold bg-green-700 hover:bg-green-600 transition"
      >
        NOT GOONED
        <div className="text-2xl mt-4">{notGooned}</div>
      </button>
    </main>
  );
}