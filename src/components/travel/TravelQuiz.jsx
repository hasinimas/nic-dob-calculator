import React, { useState } from "react";
import TravelResult from "./TravelResult";
import "../TravelScenario.css";

export default function TravelQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  // Quiz questions
  const questions = [
    {
      id: "style",
      text: "What’s your travel style?",
      options: ["🌴 Relaxation", "🗺 Adventure", "🏛 Culture", "🎉 Party"],
    },
    {
      id: "companion",
      text: "Who do you travel with?",
      options: ["👤 Solo", "❤️ Partner", "👨‍👩‍👧 Family", "👯 Friends"],
    },
    {
      id: "setting",
      text: "Pick your dream setting:",
      options: ["🏖 Beach", "🏔 Mountains", "🌆 City", "🌲 Forest"],
    },
    {
      id: "pace",
      text: "Your pace of travel?",
      options: ["🐢 Slow & mindful", "🚴 Active", "🛍 Easygoing", "📸 Fast-track"],
    },
  ];

  // Handle answer
  const handleAnswer = (option) => {
    const q = questions[step];
    setAnswers({ ...answers, [q.id]: option });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="quiz-container">
      {!showResult ? (
        <div className="quiz-card">
          <h2>{questions[step].text}</h2>
          <div className="options-grid">
            {questions[step].options.map((opt, idx) => (
              <button
                key={idx}
                className="option-btn"
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="progress">
            Question {step + 1} of {questions.length}
          </div>
        </div>
      ) : (
        <TravelResult answers={answers} onClose={() => window.location.reload()} />
      )}
    </div>
  );
}
