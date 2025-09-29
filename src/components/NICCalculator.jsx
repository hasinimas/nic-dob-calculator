// src/components/NICCalculator.jsx
import React, { useRef, useState } from "react";
import { buildInsights, chineseZodiac } from "../utils/insights";
import TravelButton from "./TravelButton";
import "./NICCalculator.css";

/**
 * Parse NIC to birthday info.
 * Returns null on invalid input, or:
 * { birthday: "YYYY-MM-DD", year, gender, age, type, birthdayDate: Date }
 */
function getBirthdayFromNIC(nic) {
  let year, dayCode;
  if (!nic) return null;

  // Trim spaces
  nic = nic.trim();

  if (nic.length === 12 && /^\d{12}$/.test(nic)) {
    year = parseInt(nic.substring(0, 4), 10);
    dayCode = parseInt(nic.substring(4, 7), 10);
  } else if (nic.length === 10 && /^\d{9}[VvXx]?$/.test(nic)) {
    year = 1900 + parseInt(nic.substring(0, 2), 10);
    // handle century roll (if your app expects > 1999 NICs adjust as needed)
    if (year < 1920) year += 100;
    dayCode = parseInt(nic.substring(2, 5), 10);
  } else {
    return null;
  }

  let gender = "Male";
  if (dayCode > 500) {
    gender = "Female";
    dayCode -= 500;
  }

  // dayCode is the day-of-year: construct date from Jan 1 + (dayCode - 1)
  const birthdayDate = new Date(year, 0, 1);
  birthdayDate.setDate(birthdayDate.getDate() + dayCode - 1);

  if (isNaN(birthdayDate.getTime())) return null;

  const birthday = birthdayDate.toISOString().split("T")[0];
  const age = new Date().getFullYear() - year;

  return {
    birthday,
    year,
    gender,
    age,
    type: birthdayDate.toDateString(),
    birthdayDate,
  };
}

export default function NICCalculator() {
  const [nic, setNic] = useState("");
  const [details, setDetails] = useState(null); // parsed birthday details
  const [insights, setInsights] = useState(null); // payload from buildInsights()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  // Called when user clicks the "Check" button
  const handleCalculate = async () => {
    const info = getBirthdayFromNIC(nic);
    if (!info) {
      setDetails(null);
      setInsights(null);
      setError("❌ Oops! Please enter a valid NIC number.");
      return;
    }

    // Clear errors, set parsed details
    setError("");
    setDetails(info);
    setInsights(null); // reset previous insights
    setLoading(true);

    // Try to play sound immediately (best chance to be considered a user gesture).
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        // do NOT await here — attempt play and continue fetching insights
        audioRef.current.play().catch((err) => {
          // Play can be blocked; that's okay — don't stop the flow
          console.debug("Audio playback prevented or failed:", err?.message || err);
        });
      }
    } catch (err) {
      console.debug("Audio issue", err);
    }

    // Fetch insights (buildInsights is async and returns { zodiac, people, event, movies })
    try {
      const payload = await buildInsights(info.birthdayDate);
      // payload should be an object like { zodiac, people, event, movies }
      // guard against unexpected returns
      const safePayload = {
        zodiac: payload?.zodiac ?? chineseZodiac(info.year),
        people: Array.isArray(payload?.people) ? payload.people : [],
        event: payload?.event ?? null,
        movies: Array.isArray(payload?.movies) ? payload.movies : [],
      };
      setInsights(safePayload);
    } catch (err) {
      console.error("Failed to load insights:", err);
      // set a minimal fallback so cards show friendly content
      setInsights({
        zodiac: chineseZodiac(info.year),
        people: [],
        event: null,
        movies: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Utility to get zodiac image filename (lowercase, no spaces).
  // Expectation: put images in public/zodiac/rat.png, ox.png, tiger.png, ...
  const zodiacAnimal = details ? chineseZodiac(details.year) : null;
  const zodiacImg = zodiacAnimal ? `/zodiac/${String(zodiacAnimal).toLowerCase()}.png` : null;

  return (
    <div className="nic-card">
      <h1 className="title">NIC Birthday Insights 🎉</h1>

      {/* Input row */}
      <div className="input-row">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter NIC number..."
          value={nic}
          onChange={(e) => setNic(e.target.value)}
        />
        <button onClick={handleCalculate} className="btn-primary">
          Check
        </button>
      </div>

      {/* Cute inline error */}
      {error && <div className="error-box">{error}</div>}

      {/* Audio element (place file at public/sounds/success.mp3) */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/success.mp3" type="audio/mpeg" />
      </audio>

      {/* Birthday details (show if parsed) */}
      {details && (
        <div className="birthday-details">
          <p>
            <strong>Birthday:</strong> {details.birthday}
          </p>
          <p>
            <strong>Age:</strong> {details.age}
          </p>
          <p>
            <strong>Gender:</strong> {details.gender}
          </p>
          <p>
            <strong>Birthday Type:</strong> {details.type}
          </p>
        </div>
      )}

      {/* Cards grid */}
      {/* Show placeholder while loading; show cards when insights is an object (could be empty arrays) */}
      {details && (
        <div className="cards-grid">
          {/* Chinese Zodiac */}
          <div className="info-card zodiac-card">
            <h2>🐲 Chinese Zodiac</h2>
            {zodiacImg ? (
              <div className="zodiac-content">
                <img
                  src={zodiacImg}
                  alt={zodiacAnimal}
                  className="zodiac-img"
                  onError={(e) => {
                    // graceful fallback: hide broken img
                    e.target.style.display = "none";
                  }}
                />
                <h3>{zodiacAnimal}</h3>
              </div>
            ) : (
              <p className="empty">No zodiac info available.</p>
            )}
          </div>

          {/* Share Birthday (people born same day) */}
          <div className="info-card">
            <h2>🎂 Share Birthday</h2>

            {loading && <p className="muted">Loading famous birthdays…</p>}
            {!loading && insights && insights.people && insights.people.length > 0 && (
              <div className="list">
                {insights.people.slice(0, 6).map((p, idx) => (
                  <div key={idx} className="line">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.name}
                      </a>
                    ) : (
                      <span>{p.name}</span>
                    )}
                    {p.bio ? <span className="small"> — {p.bio}</span> : null}
                  </div>
                ))}
              </div>
            )}
            {!loading && insights && insights.people && insights.people.length === 0 && (
              <p className="empty">No famous birthdays found for this date.</p>
            )}
          </div>

          {/* On This Day (historical event) */}
          <div className="info-card">
            <h2>📅 On This Day</h2>

            {loading && <p className="muted">Loading historical events…</p>}
            {!loading && insights && insights.event && (
              <div>
                <p>
                  <strong>{insights.event.year}</strong> — {insights.event.text}
                </p>
                {insights.event.pages && insights.event.pages.length > 0 && (
                  <p className="small">
                    <a href={insights.event.pages[0].url} target="_blank" rel="noreferrer">
                      Read more
                    </a>
                  </p>
                )}
              </div>
            )}
            {!loading && insights && !insights.event && (
              <p className="empty">No historical events found for this day.</p>
            )}
          </div>

          {/* More from your birth year (movies) */}
          <div className="info-card">
            <h2>✨ More from Your Birth Year</h2>

            {loading && <p className="muted">Loading movies…</p>}
            {!loading && insights && insights.movies && insights.movies.length > 0 && (
              <div className="movies">
                {insights.movies.slice(0, 6).map((m, i) => (
                  <div key={i} className="movie-item">
                    {m.poster ? <img src={m.poster} alt={m.title} className="movie-poster" /> : null}
                    <div className="movie-title">{m.title}</div>
                  </div>
                ))}
              </div>
            )}
            {!loading && insights && insights.movies && insights.movies.length === 0 && (
              <p className="empty">No notable movies found for this year.</p>
            )}
          </div>
        </div>
      )}

      {/* TravelButton — only show after insights load (so it doesn't pop immediately) */}
      {insights && !loading && (
        <div style={{ marginTop: 18 }}>
          <TravelButton />
        </div>
      )}
    </div>
  );
}
