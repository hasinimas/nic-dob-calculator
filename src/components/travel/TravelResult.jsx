import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import * as htmlToImage from "html-to-image";
import personas from "./personas";
import "./TravelResult.css";

export default function TravelResult({ answers, onClose }) {
  const base = personas[answers.style] || personas["🌴 Relaxation"];
  const [playSound, setPlaySound] = useState(false);
  const audioRef = useRef(null);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (playSound) {
      audioRef.current.pause();
      setPlaySound(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio play error:", err));
      setPlaySound(true);
    }
  };

  return (
    <div className="result-overlay">
      <motion.div
        className="result-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button className="close-btn" onClick={onClose}>✖</button>

        <h1>🌟 Your Travel Persona 🌟</h1>
        <h2>{base.animal} {base.name}</h2>

        <div className="result-summary">
          <p><strong>Style:</strong> {answers.style}</p>
          <p><strong>Companion:</strong> {answers.companion}</p>
          <p><strong>Setting:</strong> {answers.setting}</p>
          <p><strong>Pace:</strong> {answers.pace}</p>
        </div>

        <div className="travel-image">
          <img src={`/${base.img}`} alt={base.name} />
        </div>

        <button className="sound-btn" onClick={toggleSound}>
          {playSound ? "⏸ Stop Travel Sound" : "🔊 Feel Travel"}
        </button>

        <audio ref={audioRef} src={base.sound} loop preload="auto" />
      </motion.div>
    </div>
  );
}


