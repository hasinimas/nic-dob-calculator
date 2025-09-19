// src/components/travel/TravelQuiz.jsx
import React, { useState } from "react";
import TravelResult from "./TravelResult";
import "../TravelScenario.css";

export default function TravelQuiz({ nicState = {} }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  const questions = [
    { id: "style", text: "What’s your travel style?", options: ["🌴 Relaxation", "🗺 Adventure", "🏛 Culture", "🎉 Party"] },
    { id: "companion", text: "Who do you travel with?", options: ["👤 Solo", "❤️ Partner", "👨‍👩‍👧 Family", "👯 Friends"] },
    { id: "setting", text: "Pick your dream setting:", options: ["🏖 Beach", "🏔 Mountains", "🌆 City", "🌲 Forest"] },
    { id: "pace", text: "Your pace of travel?", options: ["🐢 Slow & mindful", "🚴 Active", "🛍 Easygoing", "📸 Fast-track"] },
  ];

  const handleAnswer = (option) => {
    const q = questions[step];
    setAnswers(prev => ({ ...prev, [q.id]: option }));
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setShowResult(true);
    }
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
    setShowResult(false);
  };

  return (
    <div className="quiz-card">
      {!showResult ? (
        <>
          <div className="quiz-header">
            <h2>{questions[step].text}</h2>
            <p className="hint">Quick — one card at a time. Tap an option to continue.</p>
          </div>

          <div className="questions">
            <div className="question">
              <div className="q-title">{questions[step].text}</div>
              <div className="q-opts">
                {questions[step].options.map((opt, idx) => (
                  <button key={idx} className="opt" onClick={() => handleAnswer(opt)}>{opt}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="quiz-actions">
            <div className="small-note">Question {step + 1} of {questions.length}</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn-ghost" onClick={reset}>Reset</button>
            </div>
          </div>
        </>
      ) : (
        <TravelResult answers={answers} nicState={nicState} onClose={() => setShowResult(false)} />
      )}
    </div>
  );
}
