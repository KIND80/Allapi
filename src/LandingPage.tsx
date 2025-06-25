import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Optionnel : change le background/hero selon tes goûts ou ta charte
export default function LandingPage({ onEnter }) {
  useEffect(() => {
    // Si déjà vu, saute direct la landing
    if (localStorage.getItem("allapi_has_visited")) {
      onEnter();
    }
  }, [onEnter]);

  const handleEnter = () => {
    localStorage.setItem("allapi_has_visited", "yes");
    if (onEnter) onEnter();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-fuchsia-800 to-black flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9 }}
      >
        {/* Halo d’ambiance */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 60% 30%, #f9fafb33 0%, #6366f188 60%, #000 100%)",
            zIndex: 1,
          }}
        />

        <motion.div
          className="z-10 flex flex-col items-center max-w-xl mx-auto text-center"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.1 }}
        >
          {/* Logo & claim */}
          <motion.div
            className="text-5xl font-black text-yellow-300 drop-shadow mb-2"
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 14 }}
          >
            ALLAPI
          </motion.div>
          <div className="mb-1 text-base text-indigo-100 uppercase font-extrabold tracking-widest">
            Le 1er réseau social{" "}
            <span className="text-yellow-300">100% vocal</span>,{" "}
            <span className="text-pink-300">anonyme</span> et{" "}
            <span className="text-green-300">universel</span>
          </div>

          <div className="text-lg text-white/80 mt-2 mb-8 font-medium">
            <span className="block mb-1">🎤 Exprime-toi, écoute, partage.</span>
            <span className="block mb-1">
              🌍 Découvre les vibes du monde entier sur la carte.
            </span>
            <span className="block">👤 Aucune identité, aucune pression.</span>
          </div>

          <motion.button
            className="mt-6 px-12 py-4 rounded-full text-2xl font-black bg-gradient-to-r from-yellow-400 to-indigo-600 hover:from-yellow-200 hover:to-indigo-800 shadow-xl text-black transition-all border-2 border-white/30 animate-bounce"
            whileHover={{ scale: 1.08, rotate: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleEnter}
            autoFocus
          >
            🚀 Explorer ALLAPI
          </motion.button>

          <div className="mt-8 text-xs text-white/70">
            <span className="font-semibold text-yellow-300">
              Aucune inscription,
            </span>{" "}
            aucune donnée personnelle, jamais de tracking.
            <br />
            <span className="italic text-indigo-100">
              La voix est à toi, partout, pour tous.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
