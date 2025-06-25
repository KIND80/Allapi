// src/FooterRGPD.tsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

export default function FooterRGPD() {
  const [visible, setVisible] = useState(
    // Persistant par session (optionnel, tu peux mettre false pour le mode demo)
    sessionStorage.getItem("footerRgpdClosed") !== "1"
  );

  function close() {
    setVisible(false);
    sessionStorage.setItem("footerRgpdClosed", "1");
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.footer
          className="w-full py-4 text-center text-xs bg-white/70 backdrop-blur border-t border-gray-200 fixed bottom-0 left-0 z-30 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex items-center gap-1 text-gray-500">
            <span role="img" aria-label="sécurité">
              🛡️
            </span>
            <span>
              ALLAPI protège ta vie privée. Aucun enregistrement nominatif,
              géolocalisation optionnelle, vocaux stockés chiffrés.
            </span>
            <Link
              to="/faq"
              className="underline text-indigo-600 font-semibold hover:text-indigo-800 ml-2"
            >
              En savoir plus
            </Link>
          </span>
          <button
            aria-label="Fermer"
            onClick={close}
            className="ml-4 px-2 py-1 rounded-full hover:bg-gray-200 transition text-lg text-gray-400 hover:text-gray-700"
            title="Fermer cette information"
          >
            ❌
          </button>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
