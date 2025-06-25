import React, { useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { motion, AnimatePresence } from "framer-motion";

export default function VibeRecorder({ onSent }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [ville, setVille] = useState("");
  const [langue, setLangue] = useState("");
  const [withGeo, setWithGeo] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timeoutId = useRef(null);
  const intervalRef = useRef(null);

  // Upload
  const handleUpload = async (blob) => {
    setUploading(true);
    setMsg("");
    setError("");
    let latitude = null,
      longitude = null;
    if (withGeo) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 7000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (e) {
        setError("Impossible de récupérer la position.");
      }
    }
    const fileName = `vibes/${Date.now()}.webm`;
    const anonId = getAnonymousId();
    await supabase
      .from("users_anonymous")
      .upsert([{ id: anonId }], { onConflict: "id" });
    const { error: uploadError } = await supabase.storage
      .from("allapi-vibes")
      .upload(fileName, blob, { contentType: "audio/webm", upsert: false });
    if (uploadError) {
      setUploading(false);
      setError("Erreur upload : " + uploadError.message);
      return;
    }
    const url = `https://gkbcjhypgsvpipjeginw.supabase.co/storage/v1/object/public/alapi-vibes/${fileName}`;
    await supabase.from("vocaux").insert([
      {
        url,
        user_id: anonId,
        latitude,
        longitude,
        hashtags: hashtags
          .split(",")
          .map((s) => s.replace(/#/g, "").trim())
          .filter(Boolean),
        ville: ville || null,
        langue: langue || null,
        duration: null,
        parent_id: null,
      },
    ]);
    setUploading(false);
    setRecording(false);
    setHashtags("");
    setVille("");
    setLangue("");
    setMsg("✅ Vibe envoyée !");
    setProgress(0);
    if (onSent) onSent();
    // 🎉 Mini effet paillettes
    document.body.classList.add("sparkle");
    setTimeout(() => {
      setMsg("");
      document.body.classList.remove("sparkle");
    }, 1800);
    try {
      new Audio("/ding.mp3").play();
    } catch (e) {}
  };

  // Enregistrement 20s max + barre de progression
  const toggleRecording = async () => {
    if (!recording) {
      setMsg("");
      setError("");
      setProgress(0);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new window.MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) =>
          audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          clearTimeout(timeoutId.current);
          clearInterval(intervalRef.current);
          setProgress(0);
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await handleUpload(blob);
        };
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setRecording(true);
        let sec = 0;
        intervalRef.current = setInterval(() => {
          sec += 0.1;
          setProgress((sec / 20) * 100);
        }, 100);
        timeoutId.current = setTimeout(() => {
          if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
        }, 20000);
      } catch (e) {
        setError("⚠️ Impossible d'accéder au micro.");
      }
    } else {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <motion.div
      className="w-full flex flex-col items-center mb-10 relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white/90 shadow-lg border px-5 py-2 rounded-full text-indigo-800 font-bold z-30 flex items-center gap-2"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.5 }}
          >
            <span>🎤</span> Appuie sur le micro pour enregistrer ta vibe !
            <button
              className="ml-2 text-indigo-700 text-xs underline"
              onClick={() => setShowOnboarding(false)}
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* BOUTON MICRO */}
      <motion.button
        className={`relative mx-auto flex items-center justify-center transition-all duration-200 shadow-2xl rounded-full w-24 h-24 text-5xl focus:outline-none overflow-hidden group ${
          recording
            ? "bg-red-500 animate-pulse scale-110"
            : "bg-indigo-500 hover:bg-indigo-600"
        }`}
        style={{ outline: "none", border: "none" }}
        onClick={toggleRecording}
        disabled={uploading}
        aria-label="Enregistrer"
        whileTap={{ scale: 1.11, rotate: -2 }}
      >
        <motion.span
          className="absolute w-full h-full bg-indigo-300/50 rounded-full animate-ping group-active:scale-95"
          initial={{ scale: 1 }}
          animate={{
            scale: recording ? 1.15 : 1,
            opacity: recording ? 0.7 : 0.5,
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <span className="z-10 relative">{recording ? "🛑" : "🎙️"}</span>
        {/* Progress bar cercle */}
        {recording && (
          <svg
            className="absolute top-0 left-0 w-full h-full"
            viewBox="0 0 96 96"
          >
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#fff"
              strokeWidth="6"
              opacity="0.35"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#2563eb"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
              initial={false}
              animate={{
                strokeDashoffset: 2 * Math.PI * 44 * (1 - progress / 100),
              }}
              transition={{ duration: 0.2 }}
            />
          </svg>
        )}
      </motion.button>
      <div className="text-lg font-bold text-indigo-900 mt-2 mb-1 tracking-tight">
        {recording ? "Enregistrement..." : "Crée ta vibe !"}
      </div>
      {/* CHAMPS EN DESSOUS */}
      <div className="w-full flex flex-col gap-2 max-w-md mt-2">
        <input
          className="border p-2 rounded text-black text-base shadow"
          type="text"
          placeholder="Hashtags (ex: motivation, fun)"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          aria-label="Hashtags"
          disabled={recording || uploading}
        />
        <input
          className="border p-2 rounded text-black text-base shadow"
          type="text"
          placeholder="Ville (optionnel)"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          aria-label="Ville"
          disabled={recording || uploading}
        />
        <input
          className="border p-2 rounded text-black text-base shadow"
          type="text"
          placeholder="Langue (optionnel)"
          value={langue}
          onChange={(e) => setLangue(e.target.value)}
          aria-label="Langue"
          disabled={recording || uploading}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
        <input
          type="checkbox"
          checked={withGeo}
          onChange={(e) => setWithGeo(e.target.checked)}
          disabled={recording || uploading}
        />
        Associer à ma position
      </label>
      {/* STATUS */}
      {uploading && (
        <div className="text-yellow-500 mt-2 text-sm">⏳ Upload...</div>
      )}
      {msg && (
        <motion.div
          className="text-green-600 mt-1 text-sm font-bold"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {msg}
        </motion.div>
      )}
      {error && (
        <motion.div
          className="text-red-500 mt-1 text-sm font-bold"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        (max 20 secondes – appuie sur le micro pour commencer)
      </div>
    </motion.div>
  );
}
