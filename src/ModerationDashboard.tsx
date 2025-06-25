import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ModerationDashboard() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  // On charge tous les vocaux signalés, qui existent encore
  useEffect(() => {
    async function fetchSignalements() {
      setLoading(true);
      // Jointure : signalements + vocal + user qui a signalé + auteur du vocal
      const { data, error } = await supabase
        .from("signalements")
        .select(
          `
          *,
          vocaux: vocal_id (
            *,
            profils:user_id (pseudo, avatar_url)
          ),
          users: user_id (pseudo)
        `
        )
        .order("created_at", { ascending: false });

      setSignalements(data || []);
      setLoading(false);
    }
    fetchSignalements();
  }, []);

  // Suppression d’un vocal (en DB et storage)
  async function supprimerVocal(vocal) {
    if (!window.confirm("Supprimer ce vocal définitivement ?")) return;

    // Supprime du storage
    if (vocal.url) {
      // Extraction du path Storage
      const path = vocal.url.split("/allapi-vibes/")[1];
      if (path) await supabase.storage.from("allapi-vibes").remove([path]);
    }
    // Supprime en DB (table vocaux)
    await supabase.from("vocaux").delete().eq("id", vocal.id);
    alert("Vocal supprimé !");
    // Refresh
    window.location.reload();
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-6 text-center text-red-700">
        🚨 Dashboard de modération — Vocaux signalés
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Chargement…</div>
      ) : signalements.length === 0 ? (
        <div className="text-center text-green-500">
          🎉 Aucun contenu signalé !
        </div>
      ) : (
        <div className="space-y-6">
          {signalements.map((s, i) =>
            !s.vocaux ? null : (
              <motion.div
                key={s.id + "_" + i}
                className="bg-white/80 border-l-8 border-red-400 p-4 rounded-xl shadow-lg flex flex-col gap-2"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      s.vocaux.profils?.avatar_url ||
                      "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                    }
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border"
                  />
                  <span className="font-bold text-indigo-800">
                    {s.vocaux.profils?.pseudo || "Profil"}
                  </span>
                  <span className="text-xs ml-4 text-gray-400">
                    Posté le {new Date(s.vocaux.created_at).toLocaleString()}
                  </span>
                </div>
                <audio
                  controls
                  src={s.vocaux.url}
                  className="w-full rounded-lg"
                />
                {s.vocaux.transcription && (
                  <div className="bg-indigo-50 text-xs p-2 rounded">
                    <span className="font-bold">Transcription :</span>{" "}
                    {s.vocaux.transcription}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Vocal ID: {s.vocal_id}</span>
                  <span>Signalé par : {s.users?.pseudo || s.user_id}</span>
                  <span>
                    Signalé le : {new Date(s.created_at).toLocaleString()}
                  </span>
                  {s.vocaux.parent_id && (
                    <span className="bg-yellow-100 px-2 rounded">Réponse</span>
                  )}
                </div>
                <div className="flex gap-4 justify-end mt-2">
                  <Link
                    to={`/profile/${s.vocaux.user_id}`}
                    className="text-xs text-blue-800 underline"
                  >
                    Voir profil
                  </Link>
                  <button
                    onClick={() => supprimerVocal(s.vocaux)}
                    className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold shadow"
                  >
                    Supprimer ce vocal
                  </button>
                </div>
              </motion.div>
            )
          )}
        </div>
      )}
    </div>
  );
}
