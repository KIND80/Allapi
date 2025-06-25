import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function FavorisPage() {
  const userId = getAnonymousId();
  const [vocaux, setVocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFavoris() {
      setLoading(true);
      setError(null);
      try {
        // Jointure pour obtenir info vibe + profil user
        const { data: favs, error } = await supabase
          .from("vocaux_favorites")
          .select(
            `
            *,
            vocaux (
              *,
              profils:user_id (pseudo, avatar_url)
            )
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setVocaux(
          (favs || []).map((f) => f.vocaux).filter(Boolean) // si le vocal a été supprimé, on l’enlève
        );
      } catch (err) {
        setError("Erreur lors du chargement des favoris.");
      }
      setLoading(false);
    }
    fetchFavoris();
  }, [userId]);

  return (
    <motion.div
      className="max-w-lg mx-auto py-8 px-2 sm:px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-600 drop-shadow">
        ⭐ Mes favoris
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : error ? (
        <div className="text-center text-red-400">{error}</div>
      ) : vocaux.length === 0 ? (
        <div className="text-center text-gray-400">
          Aucun favori enregistré.
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {vocaux.map((vocal) => (
              <motion.div
                key={vocal.id}
                className="bg-gradient-to-br from-yellow-100/40 via-pink-50/40 to-purple-50/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-2 border border-yellow-300/30 hover:scale-[1.02] transition-transform duration-300"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Link
                    to={`/profile/${vocal.user_id}`}
                    className="font-bold hover:underline flex items-center gap-2"
                  >
                    <img
                      src={
                        vocal.profils?.avatar_url ||
                        "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                      }
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border"
                    />
                    {vocal.profils?.pseudo || "Profil"}
                  </Link>
                  <span className="text-xs text-gray-400 ml-2">
                    {vocal.langue && `🌐 ${vocal.langue} `}
                    {vocal.ville && `📍 ${vocal.ville}`}
                  </span>
                </div>
                <audio controls src={vocal.url} className="w-full rounded-lg" />
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>📅 {new Date(vocal.created_at).toLocaleString()}</span>
                  {Array.isArray(vocal.hashtags) &&
                    vocal.hashtags.length > 0 && (
                      <span>
                        {vocal.hashtags.map((h, i) => (
                          <span
                            key={i}
                            className="inline-block mr-1 px-2 py-0.5 bg-yellow-100/60 rounded text-yellow-900 text-xs"
                          >
                            #{h}
                          </span>
                        ))}
                      </span>
                    )}
                </div>
                {/* POURRAJOUTER PLUS TARD : 
                <button
                  className="mt-2 text-indigo-500 text-xs underline"
                  onClick={() => ...}
                >
                  Voir sur la carte
                </button>
                */}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
