// TravelResult.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as htmlToImage from "html-to-image";
import personas from "./personas"; // keep your personas.jsx in same folder
import MapExplorer from "./MapExplorer"; // optional; if present show embedded map
import "./TravelResult.css";

/*
  Advanced TravelResult:
  - answers: quiz answers
  - nicState: optional { birthday, age, gender }
  - onClose: callback
*/

const PER_DAY_BASE = {
  "🌴 Relaxation": 120,
  "🗺 Adventure": 150,
  "🏛 Culture": 110,
  "🎉 Party": 160,
  "🍜 Foodie": 100,
  "❄ Arctic": 180,
};

// companion multipliers keyed by labels used in your quiz
const COMPANION_MULTIPLIER = {
  "🧳 Solo": 0.8,
  "👯 Friends": 1.15,
  "💑 Partner": 1.02,
  "👨‍👩‍👧 Family": 1.25,
};

function groupDiscountFactor(n) {
  if (n >= 10) return 0.90;
  if (n >= 5) return 0.95;
  return 1.0;
}
function ageDiscountFactor(age) {
  if (age === null || age === undefined) return 1.0;
  if (age < 18) return 0.85;
  if (age >= 60) return 0.90;
  return 1.0;
}

// Overpass fetch used by MapExplorer earlier if you want markers
async function fetchPlacesOverpass(lat, lon, personaKey, radius = 30000, limit = 20) {
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

// WebAudio ambient generator (no mp3 needed)
// Creates a gentle ambient loop depending on persona theme.
function createAmbientEngine(theme) {
  // returns { start(), stop() }
  let ctx = null;
  let noiseNode = null;
  let gain = null;
  let osc = null;
  let isStarted = false;

  function start() {
    if (isStarted) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = 0.0; // start muted, fade in
    gain.connect(ctx.destination);

    // noise buffer (used as base texture)
    const bufferSize = ctx.sampleRate * 1; // 1s
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    // filter choice per theme
    const filter = ctx.createBiquadFilter();
    if (theme === "beach") {
      filter.type = "lowpass";
      filter.frequency.value = 1200;
    } else if (theme === "forest") {
      filter.type = "bandpass";
      filter.frequency.value = 800;
    } else if (theme === "city") {
      filter.type = "highpass";
      filter.frequency.value = 600;
    } else if (theme === "party") {
      filter.type = "lowpass";
      filter.frequency.value = 1500;
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 1000;
    }

    noiseNode.connect(filter);
    filter.connect(gain);

    // gentle oscillator to add movement
    osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = theme === "party" ? 0.7 : 0.3;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.02;
    osc.connect(oscGain);
    oscGain.connect(gain);

    noiseNode.start();
    osc.start();
    // fade in
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.2);
    isStarted = true;
  }

  function stop() {
    if (!isStarted) return;
    try {
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      setTimeout(() => {
        noiseNode.stop();
        osc.stop();
        ctx.close();
        ctx = null;
        noiseNode = null;
        osc = null;
        gain = null;
        isStarted = false;
      }, 900);
    } catch {
      // ignore
    }
  }

  return { start, stop };
}

export default function TravelResult({ answers, nicState = {}, onClose = () => { } }) {
  if (!answers) return null;

  const personaKey = answers.style || Object.keys(personas)[0];
  const base = personas[personaKey] || { name: "Traveler", animal: "🌍", img: "/default.jpg", theme: "city" };

  // UI state
  const [numPeople, setNumPeople] = useState(1);
  const [days, setDays] = useState(3);
  const [companion, setCompanion] = useState(answers.companion || "🧳 Solo");
  const [coords, setCoords] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [errorPlaces, setErrorPlaces] = useState(null);
  const [playingAmbient, setPlayingAmbient] = useState(false);
  const ambientRef = useRef(null);
  const cardRef = useRef(null);

  // cost math
  const perDay = PER_DAY_BASE[personaKey] ?? 120;
  const companionMult = COMPANION_MULTIPLIER[companion] ?? 1.0;
  const groupFactor = groupDiscountFactor(numPeople);
  const ageFactor = ageDiscountFactor(nicState.age);
  const subtotal = perDay * days * numPeople;
  const afterCompanion = subtotal * companionMult;
  const afterGroup = afterCompanion * groupFactor;
  const afterAge = afterGroup * ageFactor;
  const serviceFee = Math.round(afterAge * 0.08);
  const total = Math.round(afterAge + serviceFee);

  // preload ambient engine (no mp3s)
  useEffect(() => {
    ambientRef.current = createAmbientEngine(base.theme || "city");
    return () => {
      try { ambientRef.current && ambientRef.current.stop(); } catch { }
    };
  }, [personaKey]);

  // toggle ambient sound
  const handleToggleAmbient = () => {
    if (!ambientRef.current) {
      ambientRef.current = createAmbientEngine(base.theme || "city");
    }
    if (playingAmbient) {
      ambientRef.current.stop();
      setPlayingAmbient(false);
    } else {
      ambientRef.current.start();
      setPlayingAmbient(true);
    }
  };

  // find places via Overpass (and set coords using geolocation)
  const handleFindPlacesNearby = () => {
    setErrorPlaces(null);
    setLoadingPlaces(true);
    if (!navigator.geolocation) {
      setErrorPlaces("Geolocation not available in this browser.");
      setLoadingPlaces(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCoords([lat, lon]);
      try {
        const els = await fetchPlacesOverpass(lat, lon, personaKey, 30000, 20);
        setPlaces(els);
        if (!els.length) setErrorPlaces("No nearby POIs found for this category — try Google Maps button below.");
      } catch (err) {
        console.error(err);
        setErrorPlaces("Places lookup failed (Overpass). You can use the Google Maps search button instead.");
      } finally {
        setLoadingPlaces(false);
      }
    }, (err) => {
      console.warn("geo error", err);
      setErrorPlaces("Geolocation denied or timed out. Use Google Maps search instead.");
      setLoadingPlaces(false);
    }, { timeout: 15000 });
  };

  // download PNG with watermark
 const handleDownload = async () => {
  if (!cardRef.current) return;
  // create wrapper that preserves gradient + size
  const exportWrapper = document.createElement("div");
  const w = cardRef.current.offsetWidth || 1000;
  exportWrapper.style.width = w + "px";
  exportWrapper.style.display = "inline-block";
  exportWrapper.style.position = "relative";
  exportWrapper.style.padding = "18px";
  exportWrapper.style.borderRadius = "16px";
  // nice gradient background for export
  exportWrapper.style.background = "linear-gradient(135deg,#ffecd2,#fcb69f)";
  exportWrapper.style.boxShadow = "0 20px 60px rgba(4,20,40,0.25)";
  exportWrapper.style.fontFamily = getComputedStyle(cardRef.current).fontFamily || "Poppins, system-ui";

  // clone card and append
  const clone = cardRef.current.cloneNode(true);

  // remove overlay/backdrop elements in the clone that might conflict
  // (if you added dynamic elements like .result-overlay, remove them)
  // keep only the inner content card
  clone.style.margin = "0";
  clone.style.boxShadow = "none"; // let wrapper provide shadow
  exportWrapper.appendChild(clone);

  // watermark
  const watermark = document.createElement("div");
  watermark.innerText = "© hasini de silva";
  watermark.style.position = "absolute";
  watermark.style.right = "12px";
  watermark.style.bottom = "10px";
  watermark.style.fontSize = "12px";
  watermark.style.color = "rgba(0,0,0,0.55)";
  watermark.style.fontWeight = "700";
  exportWrapper.appendChild(watermark);

  document.body.appendChild(exportWrapper);
  try {
    const dataUrl = await htmlToImage.toPng(exportWrapper, { cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${base.name.replace(/\s+/g, "_")}_travel_card.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("export fail", err);
    alert("Export failed in this browser. Try another browser or update your browser.");
  } finally {
    exportWrapper.remove();
  }
};


  // open google maps search for category near given coords (if available)
  const openGoogleMapsSearch = (categoryLabel) => {
    const q = encodeURIComponent(categoryLabel);
    if (coords && coords.length === 2) {
      const [lat, lon] = coords;
      // open maps search centered on lat/lon
      const url = `https://www.google.com/maps/search/${q}/@${lat},${lon},13z`;
      window.open(url, "_blank");
    } else {
      // use 'near me' search (browser/Google will prompt)
      const url = `https://www.google.com/maps/search/${q}+near+me`;
      window.open(url, "_blank");
    }
  };

  // open google maps for a specific lat/lon (navigate)
  const openInGoogleMaps = (lat, lon, name) => {
    const q = encodeURIComponent(`${name ? name + " " : ""}${lat},${lon}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    window.open(url, "_blank");
  };

  // produce short category query for Google Maps from persona
  function personaCategoryQuery() {
    switch (personaKey) {
      case "🌴 Relaxation": return "beach";
      case "🗺 Adventure": return "hiking trail";
      case "🏛 Culture": return "museum";
      case "🎉 Party": return "nightclub";
      case "🍜 Foodie": return "street food";
      case "❄ Arctic": return "scenic viewpoint";
      default: return "tourist attractions";
    }
  }

  // creative micro suggestions
  const creativeSuggestions = (() => {
    if (personaKey === "🎉 Party") return ["Sunset rooftop party", "Local DJ event", "Beach club day-pass"];
    if (personaKey === "🗺 Adventure") return ["Sunrise trek + viewpoint", "Water activity", "Village cultural trail"];
    if (personaKey === "🌴 Relaxation") return ["Sunset yoga", "Island boat lunch", "Spa afternoon"];
    if (personaKey === "🏛 Culture") return ["Guided museum tour", "Cooking class", "Heritage walk"];
    if (personaKey === "🍜 Foodie") return ["Night market tour", "Street-food crawl", "Chef table tasting"];
    if (personaKey === "❄ Arctic") return ["Northern lights chase", "Ice-scenic boat trip", "Local lodge stay"];
    return [];
  })();

  return (
    <div className="result-overlay refined">
      <motion.div className="result-card refined" ref={cardRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
        role="dialog" aria-modal="true"
      >
        <button className="close-btn" onClick={() => { try { ambientRef.current && ambientRef.current.stop(); } catch { } onClose(); }}>✖</button>

        <header className="card-header">
          <div className="left-head">
            <div className="animal-wrap">
              <div className="animal-emoji">{base.animal}</div>
            </div>
            <div className="title-wrap">
              <h2 className="persona-name">{base.name}</h2>
              <div className="small-meta">{answers?.setting || "Curated experience"} · {answers?.pace || ""}</div>
            </div>
          </div>

          <div className="estimate-chip">
            <div className="estimate-label">Estimated total</div>
            <div className="estimate-amount">${total}</div>
            <div className="per-person">Per person: ${Math.round(total / numPeople)}</div>
          </div>
        </header>

        <main className="card-main">
          <section className="left-col">
            <div className="panel glass">
              <h3>Plan & Cost</h3>

              <div className="inputs-row">
                <label>Travelers
                  <input type="number" min="1" value={numPeople} onChange={(e) => setNumPeople(Math.max(1, Number(e.target.value) || 1))} />
                </label>
                <label>Days
                  <input type="number" min="1" value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} />
                </label>
                <label>Companion
                  <select value={companion} onChange={(e) => setCompanion(e.target.value)}>
                    <option>🧳 Solo</option>
                    <option>💑 Partner</option>
                    <option>👯 Friends</option>
                    <option>👨‍👩‍👧 Family</option>
                  </select>
                </label>
              </div>

              <div className="cost-break">
                <div className="row"><div>Base/day × days × people</div><div>${perDay} × {days} × {numPeople} = <b>${Math.round(perDay * days * numPeople)}</b></div></div>
                <div className="row"><div>Companion multiplier</div><div>x {companionMult.toFixed(2)}</div></div>
                <div className="row"><div>Group discount</div><div>x {groupFactor.toFixed(2)}</div></div>
                <div className="row"><div>Age discount</div><div>x {ageFactor.toFixed(2)}</div></div>
                <div className="row"><div>Service & taxes (8%)</div><div>${serviceFee}</div></div>

                <div className="row final"><div><strong>Total</strong></div><div className="big">${total}</div></div>
                <div className="row small-note"><div>Per person</div><div>${Math.round(total / numPeople)}</div></div>
              </div>

              <div className="actions-row">
                <button className="btn primary" onClick={handleFindPlacesNearby}>
                  {loadingPlaces ? "Finding…" : "Find Places Nearby"}
                </button>

                <button className="btn ghost" onClick={() => openGoogleMapsSearch(personaCategoryQuery())}>
                  Open in Google Maps
                </button>

                <button className="btn alt" onClick={handleToggleAmbient}>
                  {playingAmbient ? "🔇 Stop Feel Travel" : "🔊 Feel Travel"}
                </button>

                <button className="btn download" onClick={handleDownload}>
                  Download Card (PNG)
                </button>
              </div>
            </div>

            <div className="panel suggestions">
              <h4>Creative suggestions</h4>
              <ul>
                {creativeSuggestions.map((s, i) => (<li key={i}>{s}</li>))}
              </ul>
            </div>

            <div className="panel linkedin">
              <h4>LinkedIn caption preview</h4>
              <textarea
                readOnly
                rows={4}
                value={`🌍 My travel persona: ${base.name} ${base.animal}
                💰 Estimated trip: $${total} for ${numPeople} people · ${days} days.
                ✨ Style: ${personaCategoryQuery()}
                #TravelQuiz #NICDemo`}
              />
              <button
                className="btn copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `🌍 My travel persona: ${base.name} ${base.animal}
                     💰 Estimated trip: $${total} for ${numPeople} people · ${days} days.
                     ✨ Style: ${personaCategoryQuery()}
                     #TravelQuiz #NICDemo`
                  ).then(() => alert("Copied to clipboard ✅"));
                }}
              >
                📋 Copy
              </button>
            </div>

          </section>

          <aside className="right-col">
            <div className="map-embed glass">
              {coords ? (
                <MapExplorer center={coords} places={places} />
              ) : (
                <>
                  <div className="map-placeholder">
                    <div className="map-msg">No location yet</div>
                    <div className="map-sub">Click Find Places Nearby to allow location and discover local {personaCategoryQuery()} spots.</div>
                    <div className="map-quick">
                      <button className="btn primary" onClick={handleFindPlacesNearby}>Allow location & find</button>
                      <button className="btn ghost" onClick={() => openGoogleMapsSearch(personaCategoryQuery())}>Open maps search</button>
                    </div>
                  </div>
                </>
              )}
              {errorPlaces && <div className="error-banner">{errorPlaces}</div>}
            </div>

            <div className="places-list glass">
              <h4>Suggested places</h4>
              {(places.length ? places : fallbackSuggestions(personaKey)).slice(0, 8).map((p, i) => {
                const name = p.tags?.name || p.display_name || p.name || fallbackSuggestions(personaKey)[i]?.name || `Place ${i + 1}`;
                const lat = p.lat ?? p.center?.lat ?? fallbackSuggestions(personaKey)[i]?.lat;
                const lon = p.lon ?? p.center?.lon ?? fallbackSuggestions(personaKey)[i]?.lon;
                return (
                  <div key={i} className="place-row">
                    <div className="place-info">
                      <div className="place-name">{name}</div>
                      <div className="place-meta">{p.tags?.amenity || p.type || ""}</div>
                    </div>
                    <div className="place-ctas">
                      {lat && lon ? (
                        <button className="btn small" onClick={() => openInGoogleMaps(lat, lon, name)}>Navigate</button>
                      ) : (
                        <a className="open-google" target="_blank" rel="noreferrer" href={p.url ?? "#"}>Open</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </main>

        <footer className="card-footer">© hasini de silva</footer>
      </motion.div>
    </div>
  );
}

// fallback suggestions helper
function fallbackSuggestions(key) {
  switch (key) {
    case "🌴 Relaxation": return [{ name: "Maldives — Atoll beaches", lat: 3.2028, lon: 73.2207 }];
    case "🗺 Adventure": return [{ name: "Chiang Mai treks", lat: 18.7883, lon: 98.9853 }];
    case "🏛 Culture": return [{ name: "Florence, Italy — art & history", lat: 43.7696, lon: 11.2558 }];
    case "🎉 Party": return [{ name: "Ibiza, Spain — nightlife", lat: 38.9067, lon: 1.4206 }];
    case "🍜 Foodie": return [{ name: "Bangkok street food", lat: 13.7563, lon: 100.5018 }];
    case "❄ Arctic": return [{ name: "Tromsø, Norway — northern lights", lat: 69.6492, lon: 18.9553 }];
    default: return [];
  }
}
