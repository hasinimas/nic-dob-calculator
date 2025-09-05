# NIC DOB Calculator (React)

A modernized React port of your original HTML/CSS/JS app. Keeps all features:
- NIC decode (12-digit & 10-digit)
- Gender detection
- Day-of-week + age
- Birthday-today confetti animation
- Floating character (male/female)
- Voice feedback (Speech Synthesis)
- Fun Insights (Wikidata + TMDB + Wikipedia)

## Run locally
```bash
npm install
npm start
```
Place runs on http://localhost:3000

## Notes
- Images live in `public/assets`.
- Insights call public APIs from the browser (no keys needed for Wikidata/Wikipedia; TMDB may rate limit).
- Styling: lightly modernized while preserving your original gradients/animations.
