import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { motion, AnimatePresence } from "framer-motion";

const avatarBase = "https://api.dicebear.com/7.x/pixel-art/svg?seed=";

export default function ProfilePage({ userId: propUserId }) {
  const { userId: paramUserId } = useParams();
  const myId = getAnonymousId();
  const userId = propUserId || paramUserId || myId;

  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMe, setIsMe] = useState(false);
  const [vibes, setVibes] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  // Fetch profil et stats
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data } = await supabase
        .from("profils")
        .select("*")
        .eq("user_id", userId)
        .single();
      setProfil(data);
      setIsMe(userId === myId);

      // Stats vibes
      const { data: vibesData } = await supabase
        .from("vocaux")
        .select("*")
        .eq("user_id", userId);
      setVibes(vibesData || []);

      // Followers
      const { count: followersCount } = await supabase
        .from("abonnements")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      setFollowers(followersCount || 0);

      // Following
      const { count: followingCount } = await supabase
        .from("abonnements")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
      setFollowing(followingCount || 0);

      setLoading(false);
    }
    fetchProfile();
  }, [userId, myId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-lg text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-lg text-red-500">
        Profil introuvable.
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-xl mx-auto p-4 mt-8 bg-white/90 rounded-3xl shadow-2xl"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <img
          src={profil.avatar_url || avatarBase + userId}
          alt="Avatar"
          className="w-24 h-24 rounded-full border-4 border-indigo-300 shadow-lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-2xl text-indigo-800">
              @{profil.pseudo}
            </span>
            {isMe && (
              <span className="px-2 py-0.5 bg-indigo-200 rounded-full text-xs text-indigo-700">
                Moi
              </span>
            )}
          </div>
          <div className="mt-1 text-gray-600">{profil.bio}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
            {profil.ville && <span>📍 {profil.ville}</span>}
            {profil.birthYear && <span>🎂 {profil.birthYear}</span>}
            {profil.genre && <span>⚧️ {profil.genre}</span>}
          </div>
          <div className="mt-4 flex gap-4 text-center">
            <Link
              to={`/follows/${userId}/followers`}
              className="text-indigo-700 hover:underline"
            >
              <span className="font-bold">{followers}</span>
              <span className="ml-1">abonnés</span>
            </Link>
            <Link
              to={`/follows/${userId}/following`}
              className="text-indigo-700 hover:underline"
            >
              <span className="font-bold">{following}</span>
              <span className="ml-1">abonnements</span>
            </Link>
          </div>
          {isMe && (
            <Link
              to="/profile-edit"
              className="inline-block mt-4 bg-indigo-700 hover:bg-indigo-900 text-white font-bold px-5 py-2 rounded-full shadow transition"
            >
              Modifier mon profil
            </Link>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-bold text-lg mb-2 text-indigo-700">
          🎙️ Vibes postées
        </h3>
        {vibes.length === 0 ? (
          <div className="text-gray-400">Aucune vibe pour l’instant.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vibes.map((v) => (
              <div
                key={v.id}
                className="bg-white/70 rounded-xl shadow p-3 flex flex-col items-start"
              >
                <audio src={v.url} controls className="w-full rounded" />
                <div className="text-xs mt-2 text-gray-500 flex gap-2 flex-wrap">
                  {v.hashtags &&
                    Array.isArray(v.hashtags) &&
                    v.hashtags.map((h, i) => (
                      <span
                        key={i}
                        className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded"
                      >
                        #{h}
                      </span>
                    ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {v.created_at?.slice(0, 16).replace("T", " ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
