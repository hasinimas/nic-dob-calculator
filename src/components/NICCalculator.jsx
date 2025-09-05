import React, { useEffect, useRef, useState } from 'react';

function getBirthdayFromNIC(nic) {
  let year, dayCode;
  if (nic.length === 12) {
    year = parseInt(nic.substring(0, 4), 10);
    dayCode = parseInt(nic.substring(4, 7), 10);
  } else if (nic.length === 10) {
    year = 1900 + parseInt(nic.substring(0, 2), 10);
    if (year < 1920) year += 100;
    dayCode = parseInt(nic.substring(2, 5), 10);
  } else {
    return '❌ Invalid NIC format';
  }
  let gender = 'Male';
  if (dayCode > 500) {
    gender = 'Female';
    dayCode -= 500;
  }
  const birthdayDate = new Date(year, 0, dayCode);
  birthdayDate.setDate(birthdayDate.getDate() - 1);
  const month = birthdayDate.getMonth() + 1;
  const day = birthdayDate.getDate();
  const birthday = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { birthday, gender };
}

function getDayOfWeek(dateStr) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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

function updateGenderStyle(gender) {
  const body = document.body;
  const char = document.getElementById('floatingCharacter');
  body.classList.remove('default','male','female');
  if (gender === 'Female') {
    body.classList.add('female');
    if (char) char.style.backgroundImage = "url('/assets/girl.jpg')";
  } else {
    body.classList.add('male');
    if (char) char.style.backgroundImage = "url('/assets/boy.jpg')";
  }
}

function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const confetti = [];
  for (let i=0;i<200;i++) {
    confetti.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height - canvas.height,
      r: Math.random()*6+2,
      d: Math.random()*200,
      color: `hsl(${Math.random()*360}, 90%, 60%)`
    });
  }
  let angle = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confetti.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
      c.y += (Math.cos(angle + c.d) + 1 + c.r/2);
      c.x += Math.sin(angle);
      if (c.y > canvas.height) { c.y = -10; c.x = Math.random()*canvas.width; }
    });
    angle += 0.01;
    requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => ctx.clearRect(0,0,canvas.width,canvas.height), 4000);
}

export default function NICCalculator() {
  const [nic, setNic] = useState('');
  const [result, setResult] = useState(null);
  const insightsLoadedRef = useRef(false);

  useEffect(() => {
    document.body.classList.add('default');
    const char = document.getElementById('floatingCharacter');
    if (char) char.style.backgroundImage = "url('/assets/couple.jpg')";
  }, []);

  const onCalculate = async () => {
    const data = getBirthdayFromNIC(nic.trim());
    if (typeof data === 'string') {
      setResult({ error: data });
      return;
    }
    const dayName = getDayOfWeek(data.birthday);
    const age = calculateAge(data.birthday);
    const birthdayToday = isBirthdayToday(data.birthday);
    setResult({ ...data, dayName, age, birthdayToday });

    launchConfetti();
    updateGenderStyle(data.gender);

    // speech synthesis
    const voiceMessage = birthdayToday
      ? `Hey! It's your birthday today! so wish your happy birthday dear!! You are ${data.gender}.`
      : `Your birthday is ${data.birthday}. You are ${data.gender}.`;
    try {
      const utterance = new SpeechSynthesisUtterance(voiceMessage);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {}

    // Insights (reuse original module and DOM renderer to ensure parity)
    try {
      const mod = await import('../utils/insights.js');
      const dob = new Date(data.birthday);
      const payload = await mod.buildInsights(dob);
      const mount = document.getElementById('insights');
      if (mount) mod.renderInsights(mount, payload);
    } catch (e) {
      console.error('Insights failed', e);
    }
  };

  return (
    <section className="card">
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter NIC Number"
          value={nic}
          onChange={e => setNic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onCalculate(); }}
          aria-label="NIC number"
        />
        <button onClick={onCalculate}>Reveal Birthday</button>
      </div>
      {result && (
        <div className="result">
          {result.error ? (
            <div className="error">{result.error}</div>
          ) : (
            <div className="grid">
              <div>🎉 Birthday: <b>{result.birthday}</b> <span className="badge">{result.dayName}</span></div>
              <div>👤 Gender: <b>{result.gender}</b></div>
              <div>🎂 Age: <b>{result.age}</b></div>
              {result.birthdayToday && <div className="happy">🎈 Happy Birthday! 🎈</div>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
