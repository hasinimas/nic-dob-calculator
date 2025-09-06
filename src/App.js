import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NICCalculator from "./components/NICCalculator";
import TravelScenario from "./components/TravelScenario";

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <header className="app-header">
          <h1>NIC → Birthday Finder</h1>
          <p className="subtitle">Sri Lankan NIC decoder · DOB · Gender · Age · Extras</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <NICCalculator />
                  <section className="insights-wrap">
                    <div id="insights" />
                  </section>
                </>
              }
            />
            <Route path="/travel" element={<TravelScenario />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>Built with React • Modernized UI</span>
        </footer>
      </div>
    </Router>
  );
}
  