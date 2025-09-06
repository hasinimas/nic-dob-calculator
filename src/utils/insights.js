// Extra fun facts & APIs for NIC DOB Calculator

// --- Date utils ---
const fmt = {
  ymd: d => d.toISOString().slice(0, 10),
  mm: d => String(d.getMonth() + 1).padStart(2, '0'),
  dd: d => String(d.getDate()).padStart(2, '0'),
};

// Chinese Zodiac
export function chineseZodiac(year) {
  const animals = [
    "Rat","Ox","Tiger","Rabbit","Dragon","Snake",
    "Horse","Goat","Monkey","Rooster","Dog","Pig"
  ];
  return animals[(year - 1900) % 12];
}

// --- Famous people from Wikidata (same month/day) ---
export async function getFamousSameDay(month, day, limit = 5) {
  const query = `
    SELECT ?person ?personLabel ?description WHERE {
      ?person wdt:P31 wd:Q5; wdt:P569 ?dob.
      FILTER(MONTH(?dob) = ${month} && DAY(?dob) = ${day})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      OPTIONAL { ?person schema:description ?description FILTER (lang(?description) = "en") }
    } LIMIT ${limit}
  `;
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/sparql-results+json' } });
    if (!res.ok) throw new Error(`Wikidata request failed: ${res.status}`);
    const json = await res.json();
    return json.results.bindings.map(b => ({
      name: b.personLabel?.value,
      bio: b.description?.value || '',
      url: b.person?.value
    }));
  } catch (err) {
    console.error("Error fetching famous people:", err);
    return [];
  }
}

// --- Historical event from Wikipedia ---
export async function getOnThisDayEvent(month, day) {
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia request failed: ${res.status}`);
    const data = await res.json();
    const pick = data?.events?.[0];
    if (!pick) return null;
    return {
      year: pick.year,
      text: pick.text,
      pages: (pick.pages || []).map(p => ({
        title: p.titles?.normalized,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.titles?.normalized || '')}`
      }))
    };
  } catch (err) {
    console.error("Error fetching On This Day event:", err);
    return null;
  }
}

// --- Movies from TMDb ---
export async function getMoviesByYear(year) {
  const key = process.env.REACT_APP_TMDB_KEY;
  if (!key) {
    console.warn("TMDB API key not found. Movies will not display.");
    return [];
  }

  const url = `https://api.themoviedb.org/3/discover/movie?primary_release_year=${year}&sort_by=popularity.desc&api_key=${key}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDb request failed: ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, 5).map(m => ({
      title: m.title,
      year,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null
    }));
  } catch (err) {
    console.error("Error fetching movies:", err);
    return [];
  }
}

// --- Orchestrator ---
export async function buildInsights(dob) {
  const month = parseInt(fmt.mm(dob), 10);
  const day   = parseInt(fmt.dd(dob), 10);
  const year  = dob.getFullYear();

  const cacheKey = `insights-${month}-${day}-${year}`;
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      if (cached.timestamp && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
        return cached.data; // use cached if less than 24h old
      }
    } catch (err) {
      console.warn("Invalid cache, refetching insights:", err);
    }
  }

  const [people, event, movies] = await Promise.all([
    getFamousSameDay(month, day),
    getOnThisDayEvent(month, day),
    getMoviesByYear(year)
  ]);

  const payload = {
    zodiac: chineseZodiac(year),
    people,
    event,
    movies
  };

  localStorage.setItem(cacheKey, JSON.stringify({ data: payload, timestamp: Date.now() }));
  return payload;
}

// --- Render function ---
export function renderInsights(container, data) {
  const { zodiac, people, event, movies } = data;

  container.innerHTML = `
    <div>
      <h2>Fun Facts & Insights 🎉</h2>
      <button id="btnTravel" class="travel-btn">View Travel Card </button>
    </div>
    <div class="cards">
      <div class="card">
        <h3>Chinese Zodiac</h3>
        <p>${zodiac}</p>
      </div>
      <div class="card">
        <h3>Shared Birthdays</h3>
        ${people.length ? people.map(p =>
          `<div class="line"><a href="${p.url}" target="_blank">${p.name}</a> — ${p.bio || ''}</div>`
        ).join('') : '<p class="empty">😔 No shared birthdays found.</p>'}
      </div>
      <div class="card">
        <h3>On This Day</h3>
        ${event ? `<p><strong>${event.year}</strong> — ${event.text}</p>` : '<p class="empty">No historical event found.</p>'}
      </div>
      <div class="card">
        <h3>Movies from your birth year</h3>
        <div class="posters">
          ${movies.filter(m => m.poster).map(m => `
            <figure>
              <img alt="${m.title}" src="${m.poster}">
              <figcaption>${m.title}</figcaption>
            </figure>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}


document.addEventListener("click", (e) => {
  if (e.target.id === "btnTravel") {
    alert("🚀 New feature coming soon!");
    // replace with your real feature logic
  }
});


