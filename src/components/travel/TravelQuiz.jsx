import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TravelResult from "./TravelResult";
import "./TravelQuiz.css";

const questions = [
  {
    id: "style",
    question: "What's your travel style?",
    options: ["🌴 Relaxation", "🗺 Adventure", "🏛 Culture", "🎉 Party", "🌲 Nature", "🏖 Luxury"],
  },
  {
    id: "companion",
    question: "Who’s your ideal companion?",
    options: ["👯 Friends", "💑 Partner", "👨‍👩‍👧 Family", "🧳 Solo"],
  },
  {
    id: "setting",
    question: "Pick a setting:",
    options: ["🏖 Beach", "⛰ Mountains", "🏙 City", "🌌 Countryside"],
  },
  {
    id: "pace",
    question: "Your pace?",
    options: ["🐢 Slow & Relaxed", "🚀 Fast & Thrilling", "⚖ Balanced"],
  },
];

export default function TravelQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option) => {
    const q = questions[step];
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleClose = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  };

  return (
    <div className="quiz-container">
      {!showResult && (
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="quiz-card"
          >
            <h2>{questions[step].question}</h2>
            <div className="options">
              {questions[step].options.map((opt, i) => (
                <button key={i} className="option-btn" onClick={() => handleSelect(opt)}>
                  {opt}
                </button>
              ))}
            </div>
            <p className="progress">
              {step + 1} / {questions.length}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {showResult && (
        <TravelResult answers={answers} onClose={handleClose} />
      )}
    </div>
  );
}
