import React from "react";
import "./TravelScenario.css"; // we'll style separately

export default function TravelScenario() {
  // For now using hardcoded data; later you can pass props or compute from NIC birthday/age
  const persona = "Adventure Romantic";
  const monthMatch = "🏖 Beach vibes (Maldives, Bali)";
  const ageMatch = "🔥 Young adult adventures (Thailand, Ibiza)";

  return (
    <div className="travel-page">
      <h1 className="title">✈ Your Travel Match</h1>

      <div className="card-grid">
        <div className="card">
          <h2>🧭 Persona</h2>
          <p>{persona}</p>
        </div>

        <div className="card">
          <h2>🎂 Birth Month</h2>
          <p>{monthMatch}</p>
        </div>

        <div className="card">
          <h2>👤 Age</h2>
          <p>{ageMatch}</p>
        </div>
      </div>

      <div className="final-card">
        <h2>🌟 Perfect Trip</h2>
        <p>
          {persona} + {monthMatch} + {ageMatch}
        </p>
      </div>
    </div>
  );
}
