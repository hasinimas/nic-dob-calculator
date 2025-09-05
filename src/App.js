import React from 'react';
import NICCalculator from './components/NICCalculator';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>NIC → Birthday Finder</h1>
        <p className="subtitle">Sri Lankan NIC decoder · DOB · Gender · Age · Extras</p>
      </header>
      <main className="app-main">
        <NICCalculator />
        <section className="insights-wrap">
          
          <div id="insights" />
        </section>
      </main>
      <footer className="app-footer">
        <span>Built with React • Modernized UI</span>
      </footer>
    </div>
  );
}
