import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import { getAnonymousId } from "./utils/user";
import { Link } from "react-router-dom";

export default function DmInbox() {
  const myId = getAnonymousId();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [micError, setMicError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from("profils")
        .select("*")
        .neq("user_id", myId);
      setUsers(data || []);
    }
    fetchUsers();
  }, [myId]);

  useEffect(() => {
    if (!selectedUser) return;
    async function fetchMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`(sender_id.eq.${myId},recipient_id.eq.${selectedUser.user_id})`)
        .or(`(sender_id.eq.${selectedUser.user_id},recipient_id.eq.${myId})`)
        .order("created_at", { ascending: true });
      setMessages(
        (data || []).filter(
          (msg) =>
            (msg.sender_id === myId &&
              msg.recipient_id === selectedUser.user_id) ||
            (msg.sender_id === selectedUser.user_id &&
              msg.recipient_id === myId)
        )
      );
    }
    fetchMessages();
    // eslint-disable-next-line
  }, [selectedUser, myId, uploading]);

  const toggleRecording = async () => {
    if (!recording) {
      setMicError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new window.MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioURL(URL.createObjectURL(blob));
          await handleUpload(blob);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setRecording(true);

        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setRecording(false);
          }
        }, 20000);
      } catch (err) {
        setMicError("Micro refusé ou indisponible.");
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
    }
  };

  const handleUpload = async (blob) => {
    if (!selectedUser) return;
    setUploading(true);

    const fileName = `dms/${Date.now()}.webm`;
    const { error } = await supabase.storage
      .from("alapi-vibes")
      .upload(fileName, blob, {
        contentType: "audio/webm",
        upsert: false,
      });
    if (error) {
      setUploading(false);
      alert("Erreur upload DM : " + error.message);
      return;
    }
    const url = `https://gkbcjhypgsvpipjeginw.supabase.co/storage/v1/object/public/alapi-vibes/${fileName}`;
    await supabase.from("messages").insert([
      {
        sender_id: myId,
        recipient_id: selectedUser.user_id,
        url,
      },
    ]);
    setUploading(false);
    setAudioURL(null);
  };

  return (
    <div className="max-w-lg mx-auto bg-white/80 rounded-2xl shadow-2xl p-3 sm:p-6 mt-8 min-h-[60vh]">
      <h2 className="text-xl font-bold mb-4">💬 Messages privés (DM vocaux)</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-1/3 border-b sm:border-b-0 sm:border-r pb-2 sm:pr-2">
          <div className="font-semibold mb-2 text-indigo-700">Profils</div>
          <div className="space-y-1 max-h-48 sm:max-h-72 overflow-auto">
            {users.map((u) => (
              <button
                key={u.user_id}
                className={`flex items-center gap-2 w-full text-left p-2 rounded transition ${
                  selectedUser?.user_id === u.user_id
                    ? "bg-indigo-200 font-bold"
                    : "hover:bg-indigo-100"
                }`}
                onClick={() => setSelectedUser(u)}
              >
                <img
                  src={
                    u.avatar_url ||
                    "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
                <span>@{u.pseudo}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="sm:w-2/3 pl-0 sm:pl-4">
          {!selectedUser ? (
            <div className="text-gray-500 mt-10 text-center">
              Sélectionne un profil pour discuter en vocal
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={
                    selectedUser.avatar_url ||
                    "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
                <span className="font-bold">@{selectedUser.pseudo}</span>
                <Link
                  to={`/profile/${selectedUser.user_id}`}
                  className="text-xs underline ml-2"
                >
                  Voir profil
                </Link>
              </div>
              <div className="bg-indigo-50 rounded p-2 mb-2 max-h-40 sm:max-h-52 overflow-y-auto flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-gray-400 text-center">Aucun message</div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 ${
                      m.sender_id === myId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <audio
                      src={m.url}
                      controls
                      className="w-32 rounded bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 items-center">
                <button
                  className={`rounded-full px-4 py-2 text-white font-bold shadow transition ${
                    recording
                      ? "bg-red-500 animate-pulse"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  onClick={toggleRecording}
                  disabled={uploading}
                >
                  {recording ? "🛑 Stop" : "🎙️ Envoyer vocal"}
                </button>
                {uploading && (
                  <span className="text-xs text-yellow-500">⏳ Upload…</span>
                )}
                {micError && (
                  <span className="text-xs text-red-500">{micError}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
