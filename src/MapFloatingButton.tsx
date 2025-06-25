// src/MapFloatingButton.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MapFloatingButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // On ne l'affiche pas déjà sur la map
  if (location.pathname === "/map") return null;

  return (
    <button
      onClick={() => navigate("/map")}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-indigo-700 hover:bg-indigo-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg flex items-center gap-2 z-50 animate-bounce"
      aria-label="Carte des vocaux"
      style={{ boxShadow: "0 8px 32px 0 rgba(50,50,100,0.25)" }}
    >
      <span role="img" aria-label="Carte">
        🗺️
      </span>
      Carte des vibes
    </button>
  );
}
