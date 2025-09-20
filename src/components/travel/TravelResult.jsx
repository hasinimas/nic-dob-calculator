// src/components/travel/TravelResult.jsx
import React, { useEffect, useRef, useState } from "react";
import personas from "./personas";
import MapExplorer from "./MapExplorer";
import * as htmlToImage from "html-to-image";
import "./TravelResult.css";

/*
 Props:
  - answers: quiz answers object (style, companion, setting, pace)
  - nicState: optional { birthday, age, gender } — used for extra discounts
  - onClose: function to close modal
*/

const PER_DAY_BASE = {
  "🌴 Relaxation": 120,
  "🗺 Adventure": 150,
  "🏛 Culture": 110,
  "🎉 Party": 160,
  "🍜 Foodie": 100,
  "❄ Arctic": 180,
};

const COMPANION_MULTIPLIER = {
  "🧳 Solo": 0.80,       // solo gets discount
  "👯 Friends": 1.15,    // friends slightly more (shared activities)
  "💑 Partner": 1.02,
  "👨‍👩‍👧 Family": 1.25,
  "🧍‍♂️ Alone": 0.80,
};

function groupDiscountFactor(n) {
  if (n >= 10) return 0.90; // 10% group discount on total
  if (n >= 5) return 0.95;  // 5% discount
  return 1.0;
}

function ageDiscountFactor(age) {
  if (!age && age !== 0) return 1.0;
  if (age < 18) return 0.85; // youth discount
  if (age >= 60) return 0.90; // senior discount
  return 1.0;
}

// Overpass fetch (places)
async function fetchPlacesOverpass(lat, lon, personaKey, radius = 30000, limit = 20) {
  // map persona to element filters
  const filtersMap = {
    "🌴 Relaxation": ['node["natural"="beach"]', 'way["natural"="beach"]', 'node["tourism"="resort"]', 'node["tourism"="hotel"]'],
    "🗺 Adventure": ['node["tourism"="attraction"]', 'node["leisure"="trail"]', 'node["tourism"="viewpoint"]'],
    "🏛 Culture": ['node["tourism"="museum"]', 'node["historic"]', 'node["amenity"="theatre"]'],
    "🎉 Party": ['node["amenity"="nightclub"]', 'node["amenity"="bar"]', 'node["amenity"="restaurant"]'],
    "🍜 Foodie": ['node["amenity"="restaurant"]', 'node["amenity"="cafe"]', 'node["amenity"="fast_food"]'],
    "❄ Arctic": ['node["natural"="peak"]', 'node["natural"="glacier"]', 'node["tourism"="information"]'],
  };
  const filters = filtersMap[personaKey] || ['node["tourism"="attraction"]'];

  const clauses = filters.map(f => `${f}(around:${radius},${lat},${lon});`).join("");
  const q = `[out:json][timeout:25];(${clauses});out center ${limit};`;
  const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Overpass failed: " + res.status);
  const json = await res.json();
  return json.elements || [];
}

export default function TravelResult({ answers, nicState = {}, onClose = () => {} }) {
  if (!answers) return null;

  const personaKey = answers.style || Object.keys(personas)[0];
  const basePersona = personas[personaKey] || { name: "Traveler", animal: "🌍", img: "/default.jpg", sound: null };

  // form inputs
  const [numPeople, setNumPeople] = useState(1);
  const [days, setDays] = useState(3);
  const [companion, setCompanion] = useState(answers.companion || "🧳 Solo");
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [places, setPlaces] = useState([]);
  const [coords, setCoords] = useState(null);
  const [errorPlaces, setErrorPlaces] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const cardRef = useRef(null);

  // compute estimates
  const perDay = PER_DAY_BASE[personaKey] ?? 120;
  const companionMult = COMPANION_MULTIPLIER[companion] ?? 1.0;
  const groupFactor = groupDiscountFactor(numPeople);
  const ageFactor = ageDiscountFactor(nicState.age);
  const subtotal = perDay * days * numPeople;
  const afterCompanion = subtotal * companionMult;
  const afterGroup = afterCompanion * groupFactor;
  const afterAge = afterGroup * ageFactor;
  const serviceFee = Math.round(afterAge * 0.08); // 8% service / taxes
  const total = Math.round(afterAge + serviceFee);

  // preload audio
  useEffect(() => {
    if (basePersona.sound) {
      audioRef.current = new Audio(basePersona.sound);
      audioRef.current.loop = true;
    } else {
      audioRef.current = null;
    }
    return () => { try { audioRef.current && audioRef.current.pause(); } catch {} };
  }, [personaKey]);

  const toggleSound = async () => {
    if (!audioRef.current) return alert("No sound available for this persona.");
    try {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch (e) {
      console.error("Audio play failed:", e);
      alert("Browser blocked audio autoplay. Click the Feel Travel button again to enable sound.");
    }
  };

  const requestGeolocationAndFind = () => {
    setErrorPlaces(null);
    setLoadingPlaces(true);
    if (!navigator.geolocation) {
      setErrorPlaces("Geolocation unavailable in your browser.");
      setLoadingPlaces(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCoords([lat, lon]);
      try {
        const el = await fetchPlacesOverpass(lat, lon, personaKey, 30000, 20);
        setPlaces(el.length ? el : []); // store raw elements
        setErrorPlaces(el.length ? null : "No places from Overpass — showing curated suggestions.");
      } catch (err) {
        console.error(err);
        setErrorPlaces("Places lookup failed — using curated suggestions.");
      } finally {
        setLoadingPlaces(false);
      }
    }, (err) => {
      console.warn("geolocation error", err);
      setErrorPlaces("Geolocation denied or timed out.");
      setLoadingPlaces(false);
    }, { timeout: 15000 });
  };

  const fallbackSuggestions = (() => {
    switch (personaKey) {
      case "🌴 Relaxation": return [{ name: "Maldives — Atoll beaches", lat: 3.2028, lon: 73.2207 }];
      case "🗺 Adventure": return [{ name: "Chiang Mai treks, Thailand", lat: 18.7883, lon: 98.9853 }];
      case "🏛 Culture": return [{ name: "Florence, Italy — art & history", lat: 43.7696, lon: 11.2558 }];
      case "🎉 Party": return [{ name: "Ibiza, Spain — nightlife", lat: 38.9067, lon: 1.4206 }];
      case "🍜 Foodie": return [{ name: "Bangkok street food", lat: 13.7563, lon: 100.5018 }];
      case "❄ Arctic": return [{ name: "Tromsø, Norway — northern lights", lat: 69.6492, lon: 18.9553 }];
      default: return [];
    }
  })();

  const downloadCard = async () => {
    if (!cardRef.current) return alert("Nothing to export.");
    // add temporary watermark
    const watermark = document.createElement("div");
    watermark.innerText = "© hasini de silva";
    watermark.style.position = "absolute";
    watermark.style.right = "10px";
    watermark.style.bottom = "8px";
    watermark.style.color = "rgba(0,0,0,0.6)";
    watermark.style.fontSize = "12px";
    watermark.style.fontWeight = "700";
    cardRef.current.appendChild(watermark);

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${basePersona.name.replace(/\s+/g, "_")}_travel_card.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("export failed", err);
      alert("Export failed in this browser.");
    } finally {
      watermark.remove();
    }
  };

  // helper: open google maps for lat/lon
  const openInGoogleMaps = (lat, lon, name) => {
    const q = encodeURIComponent(`${name ? name + " " : ""}${lat},${lon}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  // small creative suggestions (frontend-generated)
  const creativeSuggestions = (() => {
    const sug = [];
    if (personaKey === "🎉 Party") {
      sug.push("Sunset rooftop party");
      sug.push("Local DJ event");
      sug.push("Beach club day-pass");
    } else if (personaKey === "🗺 Adventure") {
      sug.push("Sunrise trek + viewpoint");
      sug.push("Water activity (rafting/snorkel)");
      sug.push("Local village trail experience");
    } else if (personaKey === "🌴 Relaxation") {
      sug.push("Sunset yoga session");
      sug.push("Island boat lunch");
      sug.push("Spa afternoon with sea view");
    } else if (personaKey === "🏛 Culture") {
      sug.push("Guided museum tour");
      sug.push("Local cooking class");
      sug.push("Historic walking tour");
    } else if (personaKey === "🍜 Foodie") {
      sug.push("Night market tour");
      sug.push("Street-food crawl");
      sug.push("Chef table tasting menu");
    } else if (personaKey === "❄ Arctic") {
      sug.push("Northern lights hunting");
      sug.push("Ice-scenic boat trip");
      sug.push("Local cultural lodge stay");
    }
    return sug;
  })();

  return (
    <div className="result-overlay">
      <div className="result-card enhanced" ref={cardRef}>
        <button className="close-btn" onClick={() => { try {audioRef.current && audioRef.current.pause(); } catch {} onClose(); }}>✖</button>

        <div className="result-top">
          <div className="animal-emoji-giant">{basePersona.animal}</div>
          <div className="persona-title">
            <h2>{basePersona.name}</h2>
            <p className="tagline">{answers?.setting || "Curated travel experience"} · {answers?.pace || ""}</p>
          </div>
        </div>

        <div className="result-body">
          <div className="left">
            <div className="summary-card">
              <h3>Estimate & Plan</h3>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <label style={{ flex: 1 }}>
                  Travelers
                  <input type="number" min={1} value={numPeople} onChange={(e)=> setNumPeople(Math.max(1, Number(e.target.value)||1))} />
                </label>
                <label style={{ flex: 1 }}>
                  Days
                  <input type="number" min={1} value={days} onChange={(e)=> setDays(Math.max(1, Number(e.target.value)||1))} />
                </label>
              </div>

              <div style={{ marginTop: 8 }}>
                <label>
                  Companion type
                  <select value={companion} onChange={(e)=> setCompanion(e.target.value)}>
                    <option>🧳 Solo</option>
                    <option>💑 Partner</option>
                    <option>👯 Friends</option>
                    <option>👨‍👩‍👧 Family</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>Base/day × days × people</div>
                  <div>${perDay} × {days} × {numPeople} = <strong>${Math.round(perDay * days * numPeople)}</strong></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>Companion multiplier</div>
                  <div>x {companionMult.toFixed(2)}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>Group discount</div>
                  <div>x {groupFactor.toFixed(2)}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>Age discount</div>
                  <div>x {ageFactor.toFixed(2)}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <div>Service & taxes (8%)</div>
                  <div>${serviceFee}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 20 }}>
                  <div><strong>Estimated total</strong></div>
                  <div><strong>${total}</strong></div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Per person</strong>: ${Math.round(total / numPeople)}
                </div>
              </div>

              <div className="cta-row" style={{ marginTop: 12 }}>
                <button className="btn-primary" onClick={requestGeolocationAndFind}>
                  {loadingPlaces ? "Finding places…" : "Find Places Nearby"}
                </button>

                <button className="btn-ghost" onClick={toggleSound}>
                  {playing ? "🔇 Stop Sound" : "🔊 Feel Travel"}
                </button>

                <button className="btn-download" onClick={downloadCard}>Download Card (PNG)</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }} className="suggestions">
              <h4>Creative suggestions</h4>
              <ul>
                {creativeSuggestions.map((s, i) => (<li key={i}>{s}</li>))}
              </ul>
            </div>
          </div>

          <div className="right">
            {coords ? (
              <MapExplorer center={coords} places={places.length ? places : fallbackSuggestions} />
            ) : (
              <div className="places-list">
                <h4>Suggested places</h4>
                {(places.length ? places : fallbackSuggestions).slice(0,8).map((p, i) => {
                  const name = p.tags?.name || p.display_name || p.name || fallbackSuggestions[i]?.name || `Place ${i+1}`;
                  const lat = p.lat ?? p.center?.lat ?? fallbackSuggestions[i]?.lat;
                  const lon = p.lon ?? p.center?.lon ?? fallbackSuggestions[i]?.lon;
                  return (
                    <div key={i} className="place-line">
                      <div>
                        <div className="place-name">{name}</div>
                        <div style={{ fontSize: 12, color: "#556" }}>{p.tags?.amenity || p.type || ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {lat && lon && (
                          <button className="btn-primary" onClick={() => openInGoogleMaps(lat, lon, name)}>Navigate</button>
                        )}
                        {!lat && !lon && (
                          <a className="open-google" target="_blank" rel="noreferrer" href={p.url ?? "#"}>Open</a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {errorPlaces && <div className="error" style={{ marginTop: 8 }}>{errorPlaces}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="linkedin-caption" style={{ marginTop: 12 }}>
          <strong>LinkedIn caption</strong>
          <textarea readOnly rows={3} value={`My travel persona: ${basePersona.name} ${basePersona.animal}\nEstimated trip: ${total}$ for ${numPeople} people, ${days} days.\n#TravelQuiz #NICDemo`} />
        </div>

        <div className="copyright">© hasini de silva</div>
      </div>
    </div>
  );
}
