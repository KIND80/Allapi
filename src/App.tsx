import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import ProfilePage from "./ProfilePage";
import ExplorePage from "./ExplorePage";
import DmInbox from "./DmInbox";
import FavorisPage from "./FavorisPage";
import ModerationDashboard from "./ModerationDashboard";
import FollowersPage from "./FollowersPage";
import MapPage from "./MapPage";
import FooterRGPD from "./FooterRGPD";
import "leaflet/dist/leaflet.css";
import MapFloatingButton from "./MapFloatingButton";
import LandingPage from "./LandingPage";
import ProfileEditPage from "./ProfileEditPage"; // AJOUT

// Composant pour afficher le profil d'un autre utilisateur
function ProfileOther() {
  const { userId } = useParams();
  return <ProfilePage userId={userId} />;
}

export default function App() {
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem("allapi_has_visited");
  });

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <Router>
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-black backdrop-blur-lg text-white z-20 shadow-lg"
      >
        <Link
          to="/"
          className="text-2xl font-bold tracking-wider flex items-center gap-2"
        >
          ALLAPI
        </Link>
        <div className="flex gap-3">
          <Link
            to="/favoris"
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-1"
          >
            ⭐ Favoris
          </Link>
          <Link
            to="/dm"
            className="bg-indigo-600 hover:bg-indigo-800 px-4 py-2 rounded-full font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-1"
          >
            💬 DM
          </Link>
          <Link
            to="/profile"
            className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-full font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-1"
          >
            👤 Mon profil
          </Link>
        </div>
      </motion.nav>

      <div className="pt-24 pb-32 bg-gradient-to-b from-black to-indigo-950 min-h-screen">
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile-edit" element={<ProfileEditPage />} /> {/* AJOUT */}
          <Route path="/profile/:userId" element={<ProfileOther />} />
          <Route path="/dm" element={<DmInbox />} />
          <Route path="/moderation" element={<ModerationDashboard />} />
          <Route path="/favoris" element={<FavorisPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/follows/:userId/:tab" element={<FollowersPage />} />
        </Routes>
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="fixed bottom-6 right-6 z-30"
      >
        <MapFloatingButton />
      </motion.div>

      <FooterRGPD />
    </Router>
  );
}
