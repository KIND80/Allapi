import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import MapVocaux from "./MapVocaux";
import { motion } from "framer-motion";

export default function MapPage() {
  const [vocaux, setVocaux] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVocaux() {
      setLoading(true);
      const { data } = await supabase
        .from("vocaux")
        .select("*, profils:user_id(pseudo, avatar_url)")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      setVocaux(data || []);
      setLoading(false);
    }
    fetchVocaux();
  }, []);

  return (
    <div className="relative min-h-[68vh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-700 py-6">
      <motion.h1
        className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4 drop-shadow-lg flex items-center gap-2"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span role="img" aria-label="map" className="text-3xl">
          🌍
        </span>
        Carte mondiale des vibes
      </motion.h1>
      <div className="w-full max-w-4xl mx-auto h-[65vh] flex items-center justify-center">
        {loading ? (
          <motion.div
            className="text-center text-indigo-200 py-20 text-lg font-semibold bg-white/10 rounded-2xl shadow-2xl w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Chargement de la carte…
          </motion.div>
        ) : (
          <motion.div
            className="w-full h-full bg-white/30 rounded-2xl shadow-2xl overflow-hidden border border-indigo-100"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <MapVocaux vocaux={vocaux} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
