import React, { useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";

// UTILE POUR MODÉRATION IA
async function transcribeAndModerateVibe({ vocalId, url }) {
  try {
    const resp = await fetch(
      "https://gkbcjhypgsvpipjeginw.functions.supabase.co/transcribe-vibe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocalId, url }),
      }
    );
    return await resp.json();
  } catch (e) {
    console.error("Erreur transcription/modération:", e);
    return null;
  }
}

export default function VibeRecorder({ onSent }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [ville, setVille] = useState("");
  const [langue, setLangue] = useState("");
  const [withGeo, setWithGeo] = useState(true); // Géoloc cochée par défaut
  const [msg, setMsg] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Typage pour TS
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timeoutId = useRef(null);

  function sparkle() {
    document.body.classList.add("sparkle");
    setTimeout(() => document.body.classList.remove("sparkle"), 1600);
  }

  // Upload
  const handleUpload = async (blob) => {
    setUploading(true);
    setMsg("");
    let latitude = null,
      longitude = null;
    if (withGeo) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 7000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (e) {}
    }
    const fileName = `vibes/${Date.now()}.webm`;
    const anonId = getAnonymousId();
    await supabase
      .from("users_anonymous")
      .upsert([{ id: anonId }], { onConflict: "id" });

    // Bucket bien nommé !
    const { error: storageError } = await supabase.storage
      .from("alapi-vibes")
      .upload(fileName, blob, { contentType: "audio/webm", upsert: false });

    if (storageError) {
      setUploading(false);
      setMsg("Erreur upload : " + storageError.message);
      return;
    }
    const url = `https://gkbcjhypgsvpipjeginw.supabase.co/storage/v1/object/public/alapi-vibes/${fileName}`;

    // Insert en base
    const { data: insertData, error: insertError } = await supabase
      .from("vocaux")
      .insert([
        {
          url,
          user_id: anonId,
          latitude,
          longitude,
          hashtags: hashtags
            .split(",")
            .map((s) => s.replace("#", "").trim())
            .filter(Boolean),
          ville: ville || null,
          langue: langue || null,
          duration: null,
          parent_id: null,
        },
      ])
      .select()
      .single();

    // Erreur d'insertion
    if (insertError) {
      setUploading(false);
      setMsg("Erreur d'enregistrement en base : " + insertError.message);
      return;
    }

    // 🎉 WOW EFFECTS
    sparkle();
    try {
      new Audio("/ding.mp3").play();
    } catch (e) {}
    if (window.navigator.vibrate) window.navigator.vibrate([80, 24, 100]);

    setUploading(false);
    setRecording(false);
    setHashtags("");
    setVille("");
    setLangue("");
    setMsg("✅ Vibe envoyée !");

    // --- APPEL MODÉRATION IA ---
    if (insertData && insertData.id && url) {
      setAnalyzing(true);
      await transcribeAndModerateVibe({ vocalId: insertData.id, url });
      setAnalyzing(false);
      setMsg("✅ Vibe envoyée et analysée par l'IA !");
    }

    if (onSent) onSent();

    setTimeout(() => setMsg(""), 3200);
  };

  // Enregistrement 20s max
  const toggleRecording = async () => {
    if (!recording) {
      setMsg("");
      if (window.navigator.vibrate) window.navigator.vibrate(36);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        clearTimeout(timeoutId.current);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleUpload(blob);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      timeoutId.current = setTimeout(() => {
        if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      }, 20000);
    } else {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="w-full flex flex-col items-center mb-10">
      {/* GROS BOUTON MICRO */}
      <button
        className={`relative mx-auto flex items-center justify-center transition-all duration-200 shadow-2xl rounded-full w-24 h-24 text-5xl focus:outline-none overflow-hidden group ${
          recording
            ? "bg-red-500 animate-pulse scale-110 rotate-2"
            : "bg-green-500 hover:bg-green-600"
        }`}
        style={{ outline: "none", border: "none" }}
        onClick={toggleRecording}
        disabled={uploading}
        aria-label="Enregistrer"
      >
        <span className="absolute w-full h-full bg-green-400/40 rounded-full animate-ping group-active:scale-95" />
        <span className="z-10 relative">{recording ? "🛑" : "🎙️"}</span>
      </button>
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
      {analyzing && (
        <div className="text-indigo-600 mt-2 text-sm">
          🔍 Analyse & transcription IA en cours...
        </div>
      )}
      {msg && <div className="text-green-600 mt-1 text-sm">{msg}</div>}
      <div className="text-xs text-gray-400 mt-2">
        (max 20 secondes – appuie sur le micro pour commencer)
      </div>
    </div>
  );
}
