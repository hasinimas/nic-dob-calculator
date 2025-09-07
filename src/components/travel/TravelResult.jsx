import React from "react";
import "../TravelScenario.css";
export default function TravelResult({ answers, onClose }) {
  if (!answers) return null; // ⬅️ prevents crash until answers exist

  const personaMap = {
    "🌴 Relaxation": { name: "Zen Explorer", animal: "🐢", img: "beach.jpg" },
    "🗺 Adventure": { name: "Wild Wanderer", animal: "🦁", img: "mountain.jpg" },
    "🏛 Culture": { name: "Cultural Seeker", animal: "🦉", img: "city.jpg" },
    "🎉 Party": { name: "Nightlife Nomad", animal: "🐬", img: "party.jpg" },
  };

  const base = personaMap[answers.style] || {
    name: "Traveler",
    animal: "🌍",
    img: "default.jpg",
  };

  return (
    <div className="result-overlay">
      <div className="result-card">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <h1>🌟 Your Travel Persona 🌟</h1>
        <h2>
          {base.animal} {base.name}
        </h2>

        <div className="result-summary">
          <p><strong>Style:</strong> {answers.style}</p>
          <p><strong>Companion:</strong> {answers.companion}</p>
          <p><strong>Setting:</strong> {answers.setting}</p>
          <p><strong>Pace:</strong> {answers.pace}</p>
        </div>

        <div className="travel-image">
          <img src={`/${base.img}`} alt={base.name} />
        </div>
        <p className="tip">
          ✨ Pro tip: Pack your bag with your {base.animal} spirit guiding you!
        </p>
      </div>
    </div>
  );
}
