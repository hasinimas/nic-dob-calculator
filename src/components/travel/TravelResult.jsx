// src/components/travel/TravelResult.jsx
import React, { useEffect, useRef, useState } from "react";
import "../TravelScenario.css";

/*
  TravelResult:
   - accepts answers (object) and optional nicState { birthday, age, gender }
   - generates persona, itinerary, packing list, budget
   - plays a short voice summary
   - provides a Download PNG action (canvas-based, no external libs)
*/

const PERSONA_MAP = {
  "🌴 Relaxation": { id: "Zen Explorer", animal: "🐢", color: ["#fceabb","#f8b500"] },
  "🗺 Adventure": { id: "Wild Wanderer", animal: "🦁", color: ["#ffd3b6","#ff7b54"] },
  "🏛 Culture":  { id: "Cultural Seeker", animal: "🦉", color: ["#e0f7fa","#90caf9"] },
  "🎉 Party":    { id: "Nightlife Nomad", animal: "🐬", color: ["#e4f0ff","#6ec1ff"] },
};

const MONTH_THEME = {
  1: "Winter wonderland",
  2: "Romantic getaways",
  3: "Nature awakening",
  4: "Adventure hikes",
  5: "Sunny escapes",
  6: "Safari & wild",
  7: "Festival hotspots",
  8: "Beach vibes",
  9: "Cultural tours",
  10: "Autumn trails",
  11: "Desert journeys",
  12: "Holiday markets",
};

function ageFlavor(age) {
  if (age === undefined || age === null) return "All-ages friendly";
  if (age < 18) return "Youthful energy";
  if (age <= 29) return "Young & adventurous";
  if (age <= 49) return "Comfort & discovery";
  return "Leisure & heritage";
}

function estimateBudget(personaKey, setting) {
  // base USD rough estimator
  let base = 600;
  if (personaKey === "🎉 Party") base += 300;
  if (setting && setting.includes("🏖")) base += 200;
  if (setting && setting.includes("🏔")) base += 150;
  return Math.round(base);
}

function genItinerary(personaKey, month, age) {
  // simple heuristics: 3 lines
  const monthText = MONTH_THEME[month] || "All-season highlights";
  if (personaKey === "🌴 Relaxation") {
    return [
      `Day 1: Beachfront wellness + sunset yoga`,
      `Day 2: Local spa & seaside market stroll`,
      `Day 3: Quiet island boat trip — perfect for ${monthText.toLowerCase()}`,
    ];
  }
  if (personaKey === "🗺 Adventure") {
    return [
      `Day 1: Guided hike + viewpoint`,
      `Day 2: Adventure sport (zipline/rafting)`,
      `Day 3: Village cultural trail — tie into ${monthText.toLowerCase()}`,
    ];
  }
  if (personaKey === "🏛 Culture") {
    return [
      `Day 1: City walk + museum pass`,
      `Day 2: Local cooking class + market tour`,
      `Day 3: Heritage sites & evening cultural show`,
    ];
  }
  // party
  return [
    `Day 1: Rooftop bars + night market`,
    `Day 2: Beach club / festival area`,
    `Day 3: Chill recovery brunch & local shopping`,
  ];
}

export default function TravelResult({ answers, nicState = {}, onClose = () => {} }) {
  if (!answers) return null;

  const personaKey = answers.style || "🌴 Relaxation";
  const persona = PERSONA_MAP[personaKey] || { id: "Traveler", animal: "🌍", color: ["#fff","#eee"] };
  const month = nicState.birthday ? (new Date(nicState.birthday).getMonth() + 1) : null;
  const age = nicState.age ?? null;
  const monthText = month ? MONTH_THEME[month] : "Any-season";
  const itinerary = genItinerary(personaKey, month, age);
  const pack = (() => {
    const base = ["Passport", "Phone charger", "Sunscreen"];
    if ((answers.setting||"").includes("🏖")) base.push("Swimwear");
    if ((answers.setting||"").includes("🏔")) base.push("Hiking boots");
    if ((answers.pace||"").includes("Active")) base.push("Sports gear");
    return base;
  })();
  const budget = estimateBudget(personaKey, answers.setting);

  // audio speak
  useEffect(() => {
    try {
      const text = `Your travel persona is ${persona.id}. Recommended trip: ${monthText}. Short plan: ${itinerary[0]}. Estimated budget ${budget} US dollars.`;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      // ignore
    }
  }, []); // run once

  // DOWNLOAD PNG: draw a canvas and create a download
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const drawAndDownload = async () => {
    setDownloading(true);
    try {
      const w = 1200, h = 628;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      // background gradient
      const grd = ctx.createLinearGradient(0,0,w, h);
      grd.addColorStop(0, persona.color[0]);
      grd.addColorStop(1, persona.color[1]);
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,w,h);

      // left block for emoji
      ctx.font = "140px serif";
      ctx.textAlign = "center";
      ctx.fillText(persona.animal, 160, 220);

      // title
      ctx.fillStyle = "#032";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${persona.id}`, 320, 120);
      ctx.font = "20px sans-serif";
      ctx.fillText(`${monthText} • ${ageFlavor(age)}`, 320, 160);

      // itinerary lines
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#052";
      ctx.fillText("Sample micro-itinerary:", 320, 210);
      ctx.font = "16px sans-serif";
      itinerary.forEach((line, i) => {
        // wrap simple: chop if too long
        const text = line.length > 60 ? line.slice(0, 57) + "..." : line;
        ctx.fillText(`• ${text}`, 340, 240 + i*30);
      });

      // packing list
      ctx.fillStyle = "#033";
      ctx.fillText("Packing highlights:", 320, 360);
      ctx.font = "16px sans-serif";
      ctx.fillText(pack.join(" • "), 320, 390);

      // budget footer
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#041";
      ctx.fillText(`Estimated budget: $${budget} (approx)`, 320, 460);

      // small footer note
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#012";
      ctx.fillText("Generated by NIC Travel Quiz • frontend demo", 320, 580);

      const dataUrl = canvas.toDataURL("image/png");

      // download
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${persona.id.replace(/\s+/g, "_")}_travel_card.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("draw failed", e);
      alert("Image generate failed in this browser. You can still copy text.");
    } finally {
      setDownloading(false);
    }
  };

  const linkedinCaption = [
    `My travel persona: ${persona.id} ${persona.animal}`,
    `Birth-month vibe: ${monthText}`,
    `Age flavour: ${ageFlavor(age)}`,
    `Quick plan: ${itinerary.map((l)=>l.replace(/\s+/g,' ')).join(" / ")}`,
    `#TravelQuiz #NICDemo`
  ].join("\n");

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(linkedinCaption);
      alert("Caption copied — paste into LinkedIn post.");
    } catch {
      alert("Copy failed. Please select and copy manually.");
    }
  };

  return (
    <div className="result-overlay" role="dialog" aria-modal="true">
      <div className="result-card">
        <button className="close-btn" onClick={onClose}>✖</button>

        <div className="result-left">
          <div className="animal-emoji">{persona.animal}</div>
          <div className="persona-name">{persona.id}</div>
          <div style={{ fontSize: 12, color: "#445", textAlign: "center" }}>{month ? `${MONTH_THEME[month]} • ${age !== null ? age + " yrs" : ""}` : "No NIC data"}</div>
        </div>

        <div className="result-right">
          <h3 className="final-title">Your Travel Match</h3>

          <ul className="detail-list">
            <li><strong>Style</strong>: {answers.style}</li>
            <li><strong>Companion</strong>: {answers.companion}</li>
            <li><strong>Setting</strong>: {answers.setting}</li>
            <li><strong>Pace</strong>: {answers.pace}</li>
          </ul>

          <div className="itinerary">
            <strong>Micro-itinerary</strong>
            <ol style={{ marginTop: 8 }}>
              {itinerary.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Packing highlights</strong>
            <div className="pack-list" style={{ marginTop: 8 }}>
              {pack.map((p, i) => <div key={i} className="pack-item">{p}</div>)}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Estimated budget</strong>
            <div style={{ marginTop: 6, fontWeight: 700 }}>${budget} (approx)</div>
          </div>

          <div className="result-actions" style={{ marginTop: 14 }}>
            <button className="btn-primary" onClick={drawAndDownload} disabled={downloading}>
              {downloading ? "Generating…" : "Download Card (PNG)"}
            </button>

            <button className="btn-ghost" onClick={copyCaption}>Copy caption</button>
          </div>

          <div style={{ marginTop: 12, color: "#556", fontSize: 13 }}>
            <div style={{ marginBottom: 6 }}><strong>LinkedIn caption (preview):</strong></div>
            <textarea readOnly value={linkedinCaption} rows={4} style={{ width: "100%", borderRadius: 8, padding: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
