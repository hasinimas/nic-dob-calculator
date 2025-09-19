// src/components/TravelScenario.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TravelQuiz from "./travel/TravelQuiz";
import "./TravelScenario.css";

export default function TravelScenario() {
  const location = useLocation();
  const navigate = useNavigate();
  // NICCalculator navigates to /travel with state { birthday, age, gender }
  const nicState = location.state || {}; // safe if undefined

  const birthday = nicState.birthday || null;
  const ageFromNic = nicState.age || null;
  const gender = nicState.gender || null;

  return (
    <div className="travel-page">
      <header className="travel-header">
        <div>
          <h1>✈ Discover Your Travel Persona</h1>
          <p className="subtitle">Answer 4 quick questions — then view a tailored travel card based on your quiz + NIC month & age.</p>
        </div>

        <div>
          {!birthday ? (
            <button className="ghost" onClick={() => navigate("/")}>Enter NIC first</button>
          ) : (
            <div className="small-note">NIC detected — birth month: {birthday ? new Date(birthday).toLocaleString('default', { month: 'long' }) : "—"}</div>
          )}
        </div>
      </header>

      <main className="travel-main">
        <section className="quiz-column">
          <TravelQuiz nicState={{ birthday, age: ageFromNic, gender }} />
        </section>

        <aside className="preview-column">
          <div className="preview-holder">
            <h3 className="preview-title">Preview (will appear after quiz)</h3>
            <div className="preview-note">Complete the quiz to open the travel card modal.</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
