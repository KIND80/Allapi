import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { motion, AnimatePresence } from "framer-motion";

const avatarBase = "https://api.dicebear.com/7.x/pixel-art/svg?seed=";

export default function ProfileForm({ onSaved }) {
  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(avatarBase + getAnonymousId());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const userId = getAnonymousId();

  // Récupère le profil existant
  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from("profils")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setPseudo(data.pseudo);
        setBio(data.bio || "");
        setAvatar(data.avatar_url || avatarBase + userId);
      }
    }
    fetchProfile();
  }, [userId]);

  function randomAvatar() {
    setAvatar(avatarBase + Math.random().toString(36).substring(7));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    const { error } = await supabase.from("profils").upsert({
      user_id: userId,
      pseudo: pseudo.trim(),
      avatar_url: avatar,
      bio: bio.trim(),
    });
    setLoading(false);
    if (!error) {
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError("Erreur lors de l’enregistrement.");
    }
  }

  return (
    <motion.form
      onSubmit={handleSave}
      className="flex flex-col gap-5 p-5 max-w-sm mx-auto bg-white/80 rounded-3xl shadow-2xl mt-8 border border-blue-100"
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-2 font-bold text-xl text-indigo-700">
          <span role="img" aria-label="user">
            🗣️
          </span>
          Mon profil ALLAPI
        </span>
      </div>
      <label className="flex flex-col gap-1">
        Pseudo
        <input
          className="border border-blue-200 bg-white/90 p-2 rounded-xl focus:ring focus:ring-blue-100 w-full"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          required
          minLength={3}
          maxLength={16}
          disabled={loading}
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-1">
        Bio <span className="text-xs text-gray-400">(présente-toi !)</span>
        <textarea
          className="border border-blue-200 bg-white/90 p-2 rounded-xl focus:ring focus:ring-blue-100 w-full"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={180}
          rows={3}
          placeholder="Quelques mots sur toi, ton humeur, ce que tu veux partager…"
          disabled={loading}
        />
      </label>
      <label className="flex flex-col gap-1">
        Avatar
        <div className="flex gap-4 items-center mt-2">
          <motion.img
            src={avatar}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-blue-400 shadow"
            whileHover={{ scale: 1.08, rotate: 4 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          />
          <motion.button
            type="button"
            onClick={randomAvatar}
            className="px-3 py-1 bg-blue-50 rounded-xl font-semibold shadow border border-blue-200 hover:bg-blue-100 active:scale-95 transition"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            aria-label="Générer un nouvel avatar"
          >
            🎲 Autre avatar
          </motion.button>
        </div>
      </label>
      <motion.button
        type="submit"
        className="bg-indigo-700 hover:bg-indigo-900 text-white py-2 rounded-xl font-bold text-lg shadow transition disabled:opacity-60"
        disabled={loading || pseudo.trim().length < 3}
        whileTap={{ scale: 0.96 }}
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </motion.button>
      <AnimatePresence>
        {success && (
          <motion.div
            className="text-green-600 text-center mt-2 font-semibold"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            ✅ Profil enregistré !
          </motion.div>
        )}
        {error && (
          <motion.div
            className="text-red-500 text-center mt-2 font-semibold"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
