// src/components/NICCalculator.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildInsights, chineseZodiac } from "../utils/insights";
import "./NICCalculator.css";

function getBirthdayFromNIC(nic) {
  let year, dayCode;
  if (!nic) return "❌ Invalid NIC format";
  if (nic.length === 12) {
    year = parseInt(nic.substring(0, 4), 10);
    dayCode = parseInt(nic.substring(4, 7), 10);
  } else if (nic.length === 10) {
    year = 1900 + parseInt(nic.substring(0, 2), 10);
    if (year < 1920) year += 100;
    dayCode = parseInt(nic.substring(2, 5), 10);
  } else {
    return "❌ Invalid NIC format";
  }

  let gender = "Male";
  if (dayCode > 500) {
    gender = "Female";
    dayCode -= 500;
  }

  const birthdayDate = new Date(year, 0, dayCode);
  birthdayDate.setDate(birthdayDate.getDate() - 1);
  const month = birthdayDate.getMonth() + 1;
  const day = birthdayDate.getDate();
  const birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { birthday, gender };
}

function getDayOfWeek(dateStr) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(dateStr).getDay()];
}

function calculateAge(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function isBirthdayToday(dateStr) {
  const t = new Date();
  const d = new Date(dateStr);
  return t.getDate() === d.getDate() && t.getMonth() === d.getMonth();
}

export default function NICCalculator() {
  const navigate = useNavigate();
  const [nic, setNic] = useState("");
  const [result, setResult] = useState(null); // { birthday, gender, dayName, age, birthdayToday } or { error }
  const [submitted, setSubmitted] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("default");
    const char = document.getElementById("floatingCharacter");
    if (char) char.style.backgroundImage = "url('/assets/couple.jpg')";
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 200,
      color: `hsl(${Math.random() * 360}, 90%, 60%)`,
    }));

    let angle = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.stroke();
        c.y += Math.cos(angle + c.d) + 1 + c.r / 2;
        c.x += Math.sin(angle);
        if (c.y > canvas.height) {
          c.y = -10;
          c.x = Math.random() * canvas.width;
        }
      });
      angle += 0.01;
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 4000);
  };

  const applyGenderStyle = (gender) => {
    const body = document.body;
    const char = document.getElementById("floatingCharacter");
    body.classList.remove("default","male","female");
    if (gender === "Female") {
      body.classList.add("female");
      if (char) char.style.backgroundImage = "url('/assets/girl.jpg')";
    } else {
      body.classList.add("male");
      if (char) char.style.backgroundImage = "url('/assets/boy.jpg')";
    }
  };

  const speakAll = (birthday, age, gender) => {
    try {
      const utter = new SpeechSynthesisUtterance(
        `Your birthday is ${new Date(birthday).toDateString()}. You are ${age} years old. Gender: ${gender}.`
      );
      utter.lang = "en-US";
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("speech failed", e);
    }
  };

  const onCalculate = async () => {
    // Reset previous results and insights
    setSubmitted(false);
    setResult(null);
    setInsights(null);
    setInsightsError(null);
    setLoadingInsights(false);

    const parsed = getBirthdayFromNIC(nic.trim());
    if (typeof parsed === "string") {
      setResult({ error: parsed });
      setSubmitted(true);
      return;
    }

    const dayName = getDayOfWeek(parsed.birthday);
    const age = calculateAge(parsed.birthday);
    const birthdayToday = isBirthdayToday(parsed.birthday);

    const res = { ...parsed, dayName, age, birthdayToday };
    setResult(res);
    setSubmitted(true);

    launchConfetti();
    applyGenderStyle(res.gender);
    speakAll(res.birthday, res.age, res.gender);

    // Load insights asynchronously
    setLoadingInsights(true);
    try {
      const dob = new Date(res.birthday);
      const payload = await buildInsights(dob);
      setInsights(payload);
    } catch (e) {
      console.error("insights failed", e);
      setInsightsError("Failed to load fun facts.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCalculate();
    }
  };

  const handleGoTravel = () => {
    let persona = "Adventure Romantic";
    if (result?.age > 30) persona = "Culture Seeker";
    if (result?.age < 18) persona = "Young Explorer";
    navigate("/travel", {
      state: {
        birthday: result?.birthday,
        age: result?.age,
        gender: result?.gender,
        persona,
      },
    });
  };

  const zodiac = result?.birthday ? chineseZodiac(new Date(result.birthday).getFullYear()) : null;

  return (
    <section className="card nic-card">
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter NIC Number"
          value={nic}
          onChange={(e) => setNic(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="NIC number"
        />
        <button onClick={onCalculate}>Reveal Birthday</button>
      </div>

      {/* Show Birthday / Gender / Age */}
      {submitted && result && (
        <div className={`result ${result.error ? "" : "visible"}`} aria-live="polite">
          {result.error ? (
            <div className="error">{result.error}</div>
          ) : (
            <div className="grid">
              <div>
                🎉 Birthday: <b>{result.birthday}</b> <span className="badge">{result.dayName}</span>
              </div>
              <div>🎂 Age: <b>{result.age}</b></div>
              <div>👤 Gender: <b>{result.gender}</b></div>
              {result.birthdayToday && <div className="happy">🎈 Happy Birthday! 🎈</div>}
            </div>
          )}
        </div>
      )}

      <canvas id="confettiCanvas" ref={canvasRef} />

      {/* Insights */}
      {submitted && (
        <section id="insights-container">
          <h2>Fun Facts & Insights 🎉</h2>

          {!loadingInsights && !insights && !insightsError && (
            <p className="muted">Run "Reveal Birthday" to load fun facts & extras</p>
          )}

          {loadingInsights && <p className="muted">Loading insights…</p>}
          {insightsError && <p className="error">{insightsError}</p>}

          {insights && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="travel-btn" onClick={handleGoTravel}>View Travel Card</button>
              </div>

              <div className="cards">
                <div className="insight-card">
                  <h3>Chinese Zodiac</h3>
                  <p>{zodiac}</p>
                </div>

                <div className="insight-card">
                  <h3>Shared Birthdays</h3>
                  {insights.people && insights.people.length ? (
                    insights.people.map((p, i) => (
                      <div key={i} className="line">
                        <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a>
                        {p.bio ? ` — ${p.bio}` : ""}
                      </div>
                    ))
                  ) : (
                    <p className="empty">😔 No shared birthdays found.</p>
                  )}
                </div>

                <div className="insight-card">
                  <h3>On This Day</h3>
                  {insights.event ? (
                    <>
                      <p><strong>{insights.event.year}</strong> — {insights.event.text}</p>
                      {insights.event.pages?.map((pg, idx) => (
                        <div key={idx}><a href={pg.url} target="_blank" rel="noreferrer">{pg.title}</a></div>
                      ))}
                    </>
                  ) : (
                    <p className="empty">No historical event found.</p>
                  )}
                </div>

                <div className="insight-card">
                  <h3>Movies from your birth year</h3>
                  <div className="posters">
                    {insights.movies && insights.movies.length ? (
                      insights.movies.filter(m => m.poster).map((m, i) => (
                        <figure key={i}>
                          <img alt={m.title} src={m.poster} />
                          <figcaption>{m.title}</figcaption>
                        </figure>
                      ))
                    ) : (
                      <p className="empty">No movies available.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
