// src/pages/TravelScenario.jsx
import React, { useState } from "react";

const monthThemes = {
  1: "❄ Winter wonderland (Switzerland, Finland)",
  2: "💕 Romantic getaways (Paris, Venice)",
  3: "🌸 Nature awakening (Japan, Cherry Blossoms)",
  4: "⛰ Adventure hikes (Nepal, Peru)",
  5: "☀ Sunny escapes (Greece, Spain)",
  6: "🦁 Safari adventures (Kenya, Tanzania)",
  7: "🎉 Festival hotspots (Brazil, Spain)",
  8: "🏖 Beach vibes (Maldives, Bali)",
  9: "🏺 Cultural tours (Turkey, Egypt)",
  10: "🎃 Spooky/fall trips (Prague, Transylvania)",
  11: "🏜 Desert journeys (Dubai, Morocco)",
  12: "🎄 Christmas markets (Germany, Austria)",
};

const ageGroups = [
  { min: 13, max: 19, desc: "🎢 Fun teen adventures (Theme parks, youth trips)" },
  { min: 20, max: 29, desc: "🔥 Young adult adventures (Thailand, Ibiza)" },
  { min: 30, max: 49, desc: "👨‍👩‍👧 Balanced family + culture trips" },
  { min: 50, max: 120, desc: "🛳 Relaxing & heritage journeys" },
];

function getAgeGroup(age) {
  return ageGroups.find(g => age >= g.min && age <= g.max)?.desc || "🌍 Traveler of all kinds";
}

export default function TravelScenario({ birthMonth = 8, age = 26, persona = "Adventure Romantic" }) {
  const theme = monthThemes[birthMonth] || "🌍 Explore anywhere you love";
  const ageFlavor = getAgeGroup(age);

  return (
    <div className="p-6 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4">✈ Your Travel Match</h1>
      <div className="bg-white shadow-md rounded-2xl p-6 max-w-md">
        <p className="text-lg mb-2">🧭 Persona: <b>{persona}</b></p>
        <p className="text-lg mb-2">🎂 Birth Month: <b>{theme}</b></p>
        <p className="text-lg mb-2">👤 Age {age}: <b>{ageFlavor}</b></p>
        <p className="mt-4 text-xl">🌟 Perfect trip = {persona} + {theme} + {ageFlavor}</p>
      </div>
    </div>
  );
}
