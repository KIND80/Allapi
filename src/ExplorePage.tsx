import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MapVocaux from "./MapVocaux";
import FeedVocaux from "./FeedVocaux";
import VibeRecorder from "./VibeRecorder";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";

type Profil = {
  pseudo?: string;
  avatar_url?: string;
};
type Vocal = {
  id: string;
  url: string;
  ville?: string;
  langue?: string;
  hashtags?: string[];
  created_at: string;
  profils?: Profil;
};

function shuffleWeighted(
  vocaux: Vocal[],
  city: string,
  affHashtags: string[],
  affLangues: string[]
): Vocal[] {
  return vocaux
    .map((v: Vocal) => {
      let score = 1;
      if (v.ville && city && v.ville.toLowerCase() === city.toLowerCase())
        score += 8;
      if (
        Array.isArray(v.hashtags) &&
        v.hashtags.some((h) =>
          affHashtags.map((h2) => h2.toLowerCase()).includes(h.toLowerCase())
        )
      )
        score += 3;
      if (
        v.langue &&
        affLangues.map((l) => l.toLowerCase()).includes(v.langue.toLowerCase())
      )
        score += 2;
      return { ...v, _weight: score };
    })
    .flatMap((v: any) => Array(v._weight).fill(v))
    .sort(() => Math.random() - 0.5)
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
}

export default function ExplorePage() {
  const [filteredVocauxFeed, setFilteredVocauxFeed] = useState<Vocal[]>([]);
  const [filteredVocauxSwipe, setFilteredVocauxSwipe] = useState<Vocal[]>([]);
  const [rawVocaux, setRawVocaux] = useState<Vocal[]>([]);
  const [myCity, setMyCity] = useState<string>("");
  const [affinityHashtags, setAffinityHashtags] = useState<string[]>([]);
  const [affinityLangues, setAffinityLangues] = useState<string[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [swipeMode, setSwipeMode] = useState<boolean>(() => {
    return localStorage.getItem("swipeMode") === "true";
  });
  const feedRef = useRef<HTMLDivElement | null>(null);

  // ---- Récupère les affinités user ----
  useEffect(() => {
    async function getAffinities() {
      const myId = getAnonymousId();
      // Ville
      const { data: profile } = await supabase
        .from("profils")
        .select("ville")
        .eq("user_id", myId)
        .single();
      setMyCity(profile?.ville || "");

      // Likes => Hashtags/langues
      const { data: liked } = await supabase
        .from("vocaux_likes")
        .select("vocal_id")
        .eq("user_id", myId);
      if (liked && liked.length > 0) {
        const ids = liked.map((l: { vocal_id: string }) => l.vocal_id);
        const { data: likedVocaux } = await supabase
          .from("vocaux")
          .select("hashtags, langue")
          .in("id", ids);
        setAffinityHashtags([
          ...new Set(
            (likedVocaux || []).flatMap((v: Vocal) =>
              Array.isArray(v.hashtags) ? v.hashtags : []
            )
          ),
        ]);
        setAffinityLangues([
          ...new Set(
            (likedVocaux || []).map((v: Vocal) => v.langue).filter((l) => !!l)
          ),
        ]);
      }
    }
    getAffinities();
  }, []);

  // ---- Quand FeedVocaux change, on sépare feed/swipe ----
  function handleFeedSync(feed: Vocal[]) {
    setRawVocaux(feed || []);
    setFilteredVocauxFeed(feed || []);
    setFilteredVocauxSwipe(
      shuffleWeighted(feed || [], myCity, affinityHashtags, affinityLangues)
    );
  }

  // ---- Si affinités changent, reshuffle pour swipe ----
  useEffect(() => {
    setFilteredVocauxSwipe(
      shuffleWeighted(rawVocaux, myCity, affinityHashtags, affinityLangues)
    );
    setIndex(0);
  }, [myCity, affinityHashtags, affinityLangues, rawVocaux]);

  // ---- Navigation swipe ----
  function handleNext() {
    setIndex((i) =>
      filteredVocauxSwipe.length > 0 ? (i + 1) % filteredVocauxSwipe.length : 0
    );
    if (window.navigator.vibrate) window.navigator.vibrate(24);
  }
  function handlePrev() {
    setIndex((i) =>
      filteredVocauxSwipe.length > 0
        ? (i - 1 + filteredVocauxSwipe.length) % filteredVocauxSwipe.length
        : 0
    );
    if (window.navigator.vibrate) window.navigator.vibrate(16);
  }
  useEffect(() => {
    setIndex(0);
    localStorage.setItem("swipeMode", swipeMode ? "true" : "false");
  }, [swipeMode, filteredVocauxSwipe.length]);

  function refetchFeed() {
    setShowMap(false);
    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="min-h-screen pt-12 pb-8 flex flex-col items-center justify-center bg-gradient-to-br from-black via-indigo-950 to-purple-900 relative z-0">
      <div className="w-full flex flex-col items-center max-w-xl mx-auto">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <VibeRecorder onSent={refetchFeed} />
        </motion.div>
        <div className="flex w-full justify-end mb-2">
          <button
            className={`px-4 py-2 rounded-full font-bold text-sm shadow transition ${
              swipeMode
                ? "bg-indigo-700 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setSwipeMode((v) => !v)}
          >
            {swipeMode ? "🗂️ Mode Liste" : "🔥 Mode Swipe"}
          </button>
        </div>
        <motion.div
          className="flex flex-col items-center justify-center w-full relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* --- Mode Liste --- */}
          {!swipeMode ? (
            <>
              <FeedVocaux onFilteredVocaux={handleFeedSync} />
              <button
                className="mt-4 mb-2 text-indigo-300 text-sm underline"
                onClick={() => setShowMap((s) => !s)}
              >
                {showMap ? "Cacher la carte" : "Explorer sur la carte 🌍"}
              </button>
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                  >
                    <MapVocaux vocaux={filteredVocauxFeed} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            filteredVocauxSwipe.length > 0 && (
              <motion.div
                className="w-full max-w-md flex flex-col items-center justify-center p-6 bg-white/10 rounded-3xl shadow-2xl border border-white/10"
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                key={filteredVocauxSwipe[index]?.id}
              >
                <div className="flex flex-col items-center gap-3 w-full">
                  <img
                    src={
                      filteredVocauxSwipe[index].profils?.avatar_url ||
                      "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                    }
                    alt="Avatar"
                    className="w-16 h-16 rounded-full border-2 border-indigo-400 shadow-lg mb-2"
                  />
                  <div className="font-bold text-xl text-indigo-900 mb-1">
                    @{filteredVocauxSwipe[index].profils?.pseudo || "Profil"}
                  </div>
                  <audio
                    controls
                    src={filteredVocauxSwipe[index].url}
                    className="w-full my-2 rounded-lg"
                  />
                  <div className="flex gap-2 text-sm text-gray-600 mb-1">
                    {filteredVocauxSwipe[index].ville && (
                      <span>📍 {filteredVocauxSwipe[index].ville}</span>
                    )}
                    {filteredVocauxSwipe[index].langue && (
                      <span>🌐 {filteredVocauxSwipe[index].langue}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(filteredVocauxSwipe[index].hashtags) &&
                      filteredVocauxSwipe[index].hashtags.map(
                        (h: string, i: number) => (
                          <span
                            key={i}
                            className="bg-indigo-800/60 text-white px-2 rounded text-xs"
                          >
                            #{h}
                          </span>
                        )
                      )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(
                      filteredVocauxSwipe[index].created_at
                    ).toLocaleString()}
                  </div>
                  <div className="flex justify-between w-full mt-6">
                    <button
                      onClick={handlePrev}
                      className="text-3xl px-6 py-2 rounded-full shadow bg-white/30 hover:bg-white/60 transition font-bold"
                      aria-label="Vibe précédente"
                    >
                      ⬅️
                    </button>
                    <div className="text-xl text-indigo-800 font-bold tracking-wide px-6">
                      {index + 1} / {filteredVocauxSwipe.length}
                    </div>
                    <button
                      onClick={handleNext}
                      className="text-3xl px-6 py-2 rounded-full shadow bg-white/30 hover:bg-white/60 transition font-bold"
                      aria-label="Vibe suivante"
                    >
                      ➡️
                    </button>
                  </div>
                </div>
                <button
                  className="mt-8 mb-2 text-indigo-400 text-sm underline"
                  onClick={() => setShowMap((s) => !s)}
                >
                  {showMap ? "Cacher la carte" : "Voir la carte 🌍"}
                </button>
                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0, y: 30, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 30, scale: 0.95 }}
                      transition={{ duration: 0.6 }}
                    >
                      <MapVocaux vocaux={filteredVocauxSwipe} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          )}
        </motion.div>
        <div className="mt-6 text-xs text-indigo-300 text-center">
          {swipeMode
            ? "Swipe ou utilise les flèches pour passer d'une vibe à l'autre !"
            : "Mode Liste : découvre toutes les vibes du feed filtré. Tu peux aussi explorer la carte !"}
        </div>
      </div>
    </div>
  );
}
