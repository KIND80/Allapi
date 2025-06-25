import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getAnonymousId } from "./utils/user";
import ReplyRecorder from "./ReplyRecorder";

// Génère une icône Leaflet avec avatar ou par défaut
function avatarIcon(url) {
  return new L.Icon({
    iconUrl: url || "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -30],
    className: "avatar-marker",
  });
}

export default function MapVocaux({ vocaux: vocauxProp }) {
  const myId = getAnonymousId?.() || "";
  const [vocaux, setVocaux] = useState([]);
  const [center, setCenter] = useState([48.858, 2.346]);
  const [zoom, setZoom] = useState(3);

  useEffect(() => {
    const filtered = (vocauxProp || []).filter(
      (v) =>
        typeof v.latitude === "number" &&
        typeof v.longitude === "number" &&
        !isNaN(v.latitude) &&
        !isNaN(v.longitude)
    );
    setVocaux(filtered);
    if (filtered.length > 0) {
      setCenter([filtered[0].latitude, filtered[0].longitude]);
      setZoom(8);
    } else {
      setCenter([48.858, 2.346]);
      setZoom(3);
    }
  }, [vocauxProp]);

  return (
    <motion.div
      className="h-[60vh] w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl my-8 bg-gradient-to-br from-indigo-800/40 to-black/60 border border-white/10"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {vocaux.length === 0 && (
        <div className="flex items-center justify-center h-full text-white text-lg bg-black/60 rounded p-2 absolute inset-0 z-10">
          Aucun vocal géolocalisé pour l’instant.
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {vocaux.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={avatarIcon(v.profils?.avatar_url)}
          >
            <Popup>
              <motion.div
                className="flex flex-col items-center gap-2 p-1 min-w-[180px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={`/profile/${v.user_id}`}
                  className="font-bold flex items-center gap-2 mb-1 hover:underline"
                  style={{ textDecoration: "none", color: "#333" }}
                >
                  <img
                    src={
                      v.profils?.avatar_url ||
                      "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon"
                    }
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border"
                  />
                  @{v.profils?.pseudo || "Anonyme"}
                  {v.user_id === myId && (
                    <span className="text-xs ml-2 bg-indigo-100 text-indigo-700 px-2 rounded">
                      Moi
                    </span>
                  )}
                </Link>
                <audio src={v.url} controls className="w-full rounded" />
                <span className="text-xs text-gray-600">
                  {v.ville && <>📍 {v.ville} </>}
                  {v.langue && <>· 🌐 {v.langue}</>}
                </span>
                <span className="text-xs text-gray-500">
                  {v.created_at?.slice(0, 16).replace("T", " ")}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(v.hashtags) &&
                    v.hashtags.map((h, i) => (
                      <span
                        key={i}
                        className="bg-indigo-800/80 text-white px-2 rounded text-xs"
                      >
                        #{h}
                      </span>
                    ))}
                </div>
                {/* === Bouton Répondre === */}
                <ReplyRecorder
                  parentId={v.id}
                  onSent={() => window.location.reload()}
                />
              </motion.div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
