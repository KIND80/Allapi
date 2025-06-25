import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// TYPE du profil utilisateur
type UserProfile = {
  user_id: string;
  avatar_url?: string;
  pseudo?: string;
};

export default function FollowersPage() {
  const { userId, tab } = useParams<{ userId: string; tab: string }>();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab = followers | following
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let ids: string[] = [];
      if (tab === "followers") {
        // Qui ME suit
        const { data, error } = await supabase
          .from("abonnements")
          .select("follower_id")
          .eq("following_id", userId);
        if (!data || error) {
          setUsers([]);
          setLoading(false);
          return;
        }
        ids = data.map((d: { follower_id: string }) => d.follower_id);
      } else {
        // Qui JE suis
        const { data, error } = await supabase
          .from("abonnements")
          .select("following_id")
          .eq("follower_id", userId);
        if (!data || error) {
          setUsers([]);
          setLoading(false);
          return;
        }
        ids = data.map((d: { following_id: string }) => d.following_id);
      }
      if (!ids || ids.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }
      const { data: profils } = await supabase
        .from("profils")
        .select("*")
        .in("user_id", ids);
      setUsers((profils || []) as UserProfile[]);
      setLoading(false);
    }
    fetch();
  }, [userId, tab]);

  return (
    <motion.div
      className="max-w-md mx-auto p-6 bg-white/90 rounded-2xl shadow-2xl mt-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center gap-2">
        {tab === "followers" ? "👥 Abonnés" : "🧭 Abonnements"}
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-400">Aucun résultat</div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {users.map((u) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.4 }}
              >
                <Link
                  to={`/profile/${u.user_id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50/60 transition"
                >
                  <img
                    src={
                      u.avatar_url ||
                      "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                    }
                    alt="avatar"
                    className="w-10 h-10 rounded-full border-2 border-indigo-300 shadow"
                  />
                  <span className="font-bold text-indigo-900 text-lg">
                    @{u.pseudo || "Profil"}
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
