import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { Link } from "react-router-dom";
import ReplyRecorder from "./ReplyRecorder";
import { motion } from "framer-motion";

export default function FeedVocaux({ onFilteredVocaux }) {
  const [vocaux, setVocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = getAnonymousId();
  const [likes, setLikes] = useState({});
  const [favorites, setFavorites] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [favoriteCounts, setFavoriteCounts] = useState({});
  const [error, setError] = useState(null);
  const [isFlagged, setIsFlagged] = useState({});

  // Filtres
  const [search, setSearch] = useState("");
  const [filterHashtag, setFilterHashtag] = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [filterLangue, setFilterLangue] = useState("");

  // Fetch vocaux + profils
  useEffect(() => {
    async function fetchVocaux() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("vocaux")
          .select(
            `
            *,
            profils:user_id (pseudo, avatar_url)
          `
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        setVocaux(data || []);
      } catch (err) {
        setError("Erreur de chargement des vibes.");
      }
      setLoading(false);
    }
    fetchVocaux();
  }, []);

  // Fetch signalements
  useEffect(() => {
    async function fetchSignalements() {
      const { data: sig } = await supabase
        .from("signalements")
        .select("vocal_id");
      const flags = {};
      (sig || []).forEach((s) => {
        flags[s.vocal_id] = true;
      });
      setIsFlagged(flags);
    }
    fetchSignalements();
  }, [vocaux.length]);

  // Likes/favoris user
  useEffect(() => {
    async function fetchUserLikes() {
      const { data } = await supabase
        .from("vocaux_likes")
        .select("vocal_id")
        .eq("user_id", userId);
      setLikes(Object.fromEntries((data || []).map((l) => [l.vocal_id, true])));
    }
    async function fetchUserFavorites() {
      const { data } = await supabase
        .from("vocaux_favorites")
        .select("vocal_id")
        .eq("user_id", userId);
      setFavorites(
        Object.fromEntries((data || []).map((f) => [f.vocal_id, true]))
      );
    }
    fetchUserLikes();
    fetchUserFavorites();
  }, [userId, vocaux.length]);

  // Compte tous les likes/favoris
  useEffect(() => {
    async function fetchLikeCounts() {
      const { data } = await supabase.from("vocaux_likes").select("vocal_id");
      const counts = {};
      (data || []).forEach((l) => {
        counts[l.vocal_id] = (counts[l.vocal_id] || 0) + 1;
      });
      setLikeCounts(counts);
    }
    async function fetchFavoriteCounts() {
      const { data } = await supabase
        .from("vocaux_favorites")
        .select("vocal_id");
      const counts = {};
      (data || []).forEach((f) => {
        counts[f.vocal_id] = (counts[f.vocal_id] || 0) + 1;
      });
      setFavoriteCounts(counts);
    }
    fetchLikeCounts();
    fetchFavoriteCounts();
  }, [vocaux.length, likes, favorites]);

  // Like/Favori avec son
  async function toggleLike(vocalId) {
    if (likes[vocalId]) {
      await supabase
        .from("vocaux_likes")
        .delete()
        .eq("vocal_id", vocalId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("vocaux_likes")
        .insert([{ vocal_id: vocalId, user_id: userId }]);
      try {
        new Audio("/ding.mp3").play();
      } catch (e) {}
    }
    const { data } = await supabase
      .from("vocaux_likes")
      .select("vocal_id")
      .eq("user_id", userId);
    setLikes(Object.fromEntries((data || []).map((l) => [l.vocal_id, true])));
  }
  async function toggleFavorite(vocalId) {
    if (favorites[vocalId]) {
      await supabase
        .from("vocaux_favorites")
        .delete()
        .eq("vocal_id", vocalId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("vocaux_favorites")
        .insert([{ vocal_id: vocalId, user_id: userId }]);
      try {
        new Audio("/ding.mp3").play();
      } catch (e) {}
    }
    const { data } = await supabase
      .from("vocaux_favorites")
      .select("vocal_id")
      .eq("user_id", userId);
    setFavorites(
      Object.fromEntries((data || []).map((f) => [f.vocal_id, true]))
    );
  }

  // Filtrage
  const filteredVocaux = vocaux.filter(
    (v) =>
      (!search ||
        (v.profils?.pseudo &&
          v.profils.pseudo.toLowerCase().includes(search.toLowerCase())) ||
        (v.ville && v.ville.toLowerCase().includes(search.toLowerCase())) ||
        (v.langue && v.langue.toLowerCase().includes(search.toLowerCase())) ||
        (Array.isArray(v.hashtags) &&
          v.hashtags.some((h) =>
            h.toLowerCase().includes(search.toLowerCase())
          ))) &&
      (!filterHashtag ||
        (Array.isArray(v.hashtags) &&
          v.hashtags.some(
            (h) =>
              h.toLowerCase() === filterHashtag.toLowerCase().replace(/^#/, "")
          ))) &&
      (!filterVille ||
        (v.ville &&
          v.ville.toLowerCase().includes(filterVille.toLowerCase()))) &&
      (!filterLangue ||
        (v.langue &&
          v.langue.toLowerCase().includes(filterLangue.toLowerCase())))
  );

  useEffect(() => {
    if (onFilteredVocaux) onFilteredVocaux(filteredVocaux);
  }, [JSON.stringify(filteredVocaux)]);

  // UI FEED
  return (
    <motion.div
      className="max-w-lg mx-auto py-8 px-2 sm:px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
        🌍 Explore les vibes du monde entier
      </h2>
      {/* --- Barre de recherche/filtrage --- */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <input
          className="border p-1 rounded"
          placeholder="🔍 Recherche (pseudo, ville, hashtag...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Recherche"
        />
        <input
          className="border p-1 rounded"
          placeholder="#Hashtag"
          value={filterHashtag}
          onChange={(e) => setFilterHashtag(e.target.value.replace(/^#/, ""))}
          aria-label="Filtrer par hashtag"
        />
        <input
          className="border p-1 rounded"
          placeholder="Ville"
          value={filterVille}
          onChange={(e) => setFilterVille(e.target.value)}
          aria-label="Filtrer par ville"
        />
        <input
          className="border p-1 rounded"
          placeholder="Langue"
          value={filterLangue}
          onChange={(e) => setFilterLangue(e.target.value)}
          aria-label="Filtrer par langue"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : error ? (
        <div className="text-center text-red-400">{error}</div>
      ) : filteredVocaux.length === 0 ? (
        <div className="text-center text-gray-400">Aucune vibe publique.</div>
      ) : (
        <div className="space-y-6">
          {filteredVocaux
            .filter((vocal) => !vocal.parent_id)
            .map((vocal) => (
              <motion.div
                key={vocal.id}
                className="bg-gradient-to-br from-white/20 via-indigo-50/30 to-purple-50/20 rounded-2xl p-6 shadow-2xl flex flex-col gap-2 border border-white/20 hover:scale-[1.01] transition"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* --- PSEUDO & AVATAR CLIQUABLES --- */}
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
                  {/* Badge signalé */}
                  {isFlagged[vocal.id] && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      ⚠️ Signalé
                    </span>
                  )}
                </div>
                <audio controls src={vocal.url} className="w-full rounded-lg" />
                {/* Date et géoloc */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>📅 {new Date(vocal.created_at).toLocaleString()}</span>
                  {vocal.latitude && vocal.longitude ? (
                    <span>
                      [Lat: {Number(vocal.latitude).toFixed(3)}, Lon:{" "}
                      {Number(vocal.longitude).toFixed(3)}]
                    </span>
                  ) : (
                    <span>🌐 Anonyme</span>
                  )}
                  {/* --- Hashtags visibles --- */}
                  {Array.isArray(vocal.hashtags) &&
                    vocal.hashtags.length > 0 && (
                      <span>
                        {vocal.hashtags.map((h, i) => (
                          <span
                            key={i}
                            className="inline-block mr-1 px-2 py-0.5 bg-indigo-900/40 rounded text-indigo-100 text-xs"
                          >
                            #{h}
                          </span>
                        ))}
                      </span>
                    )}
                </div>
                {/* Like & Favori + Signalement */}
                <div className="flex gap-4 justify-end mt-2 items-center">
                  <motion.button
                    whileTap={{ scale: 1.25 }}
                    onClick={() => toggleLike(vocal.id)}
                    className={`text-xl transition ${
                      likes[vocal.id] ? "text-pink-500" : "text-gray-400"
                    }`}
                    title="Like"
                    aria-label="Like"
                  >
                    ❤️
                  </motion.button>
                  <span className="text-xs text-gray-200">
                    {likeCounts[vocal.id] || 0}
                  </span>
                  <motion.button
                    whileTap={{ scale: 1.25 }}
                    onClick={() => toggleFavorite(vocal.id)}
                    className={`text-xl transition ${
                      favorites[vocal.id] ? "text-yellow-400" : "text-gray-400"
                    }`}
                    title="Favori"
                    aria-label="Favori"
                  >
                    ⭐
                  </motion.button>
                  <span className="text-xs text-gray-200">
                    {favoriteCounts[vocal.id] || 0}
                  </span>
                  {/* Signalement */}
                  <motion.button
                    whileTap={{ scale: 1.3, rotate: 8 }}
                    className="text-xs text-red-400 underline ml-2"
                    title="Signaler cette vibe"
                    onClick={async () => {
                      await supabase
                        .from("signalements")
                        .insert([{ vocal_id: vocal.id, user_id }]);
                      alert("🚩 Vibe signalée, merci du signalement !");
                    }}
                  >
                    🚩 Signaler
                  </motion.button>
                </div>
                {/* ----------- BONUS TRANSCRIPTION IA ----------- */}
                {!vocal.transcription ? (
                  <button
                    className="text-xs text-blue-600 underline mt-1"
                    onClick={async () => {
                      // Remplace par ton appel API réel ici
                      const transcript = await transcribeVocal(vocal.url);
                      await supabase
                        .from("vocaux")
                        .update({ transcription: transcript })
                        .eq("id", vocal.id);
                      window.location.reload();
                    }}
                  >
                    🎧 Transcrire
                  </button>
                ) : (
                  <div className="text-xs text-gray-800 mt-1 bg-white/80 p-2 rounded">
                    <span className="font-bold">Transcription :</span>{" "}
                    {vocal.transcription}
                  </div>
                )}
                {/* -------- REPLY (réponse audio) ---------- */}
                <ReplyRecorder
                  parentId={vocal.id}
                  onSent={() => window.location.reload()}
                />
                {/* Réponses en fil */}
                <div className="ml-8 mt-2 space-y-2">
                  {filteredVocaux
                    .filter((reply) => reply.parent_id === vocal.id)
                    .map((reply) => (
                      <motion.div
                        key={reply.id}
                        className="bg-white/40 p-2 rounded-xl flex items-center gap-3"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Link
                          to={`/profile/${reply.user_id}`}
                          className="font-bold hover:underline flex items-center gap-2"
                        >
                          <img
                            src={
                              reply.profils?.avatar_url ||
                              "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                            }
                            alt="Avatar"
                            className="w-6 h-6 rounded-full border"
                          />
                          {reply.profils?.pseudo || "Profil"}
                        </Link>
                        <audio controls src={reply.url} className="w-44" />
                        <span className="text-xs text-gray-400">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                        {/* Signalement reply */}
                        <motion.button
                          whileTap={{ scale: 1.2, rotate: 8 }}
                          className="text-xs text-red-400 underline ml-2"
                          title="Signaler cette réponse"
                          onClick={async () => {
                            await supabase
                              .from("signalements")
                              .insert([{ vocal_id: reply.id, user_id }]);
                            alert("🚩 Réponse signalée !");
                          }}
                        >
                          🚩
                        </motion.button>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            ))}
        </div>
      )}
    </motion.div>
  );
}

// Fonction fake de transcription IA à remplacer par ta vraie API
async function transcribeVocal(url) {
  // Ici tu mets l'appel API réelle
  return "Ceci est une transcription automatique du vocal (exemple).";
}
