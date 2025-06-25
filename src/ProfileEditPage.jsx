// src/ProfileEditPage.jsx
import React from "react";
import ProfileForm from "./ProfileForm";
import { Link } from "react-router-dom";

export default function ProfileEditPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white/90 rounded-2xl shadow-2xl">
      <h2 className="font-bold text-2xl text-indigo-800 mb-4">
        Modifier mon profil
      </h2>
      <ProfileForm />
      <div className="mt-4 text-center">
        <Link
          to="/profile"
          className="text-indigo-700 underline hover:text-indigo-900"
        >
          Retour au profil
        </Link>
      </div>
    </div>
  );
}
