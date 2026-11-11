// Motor de MyGym: biblioteca, generador de rutinas y pesos sugeridos.
"use strict";

const CATS = { pecho: "Pecho", espalda: "Espalda", hombro: "Hombro", brazos: "Brazos", pierna: "Pierna", abdomen: "Abdomen" };
const PAT = {
  press_h: "Pecho, tríceps y hombro frontal", press_inc: "Pecho superior, hombro frontal y tríceps", fly: "Pecho",
  pullover: "Dorsales y pecho", vpull: "Dorsales y bíceps", hrow: "Espalda media, dorsales y bíceps",
  hinge: "Femorales, glúteos y espalda baja", back_ext: "Espalda baja y glúteos", shrug: "Trapecio",
  press_v: "Hombros y tríceps", lateral: "Hombro lateral", front: "Hombro frontal", rear: "Hombro posterior y espalda alta",
  bi: "Bíceps", bi_h: "Braquial, bíceps y antebrazo", tri_c: "Tríceps y pecho", tri: "Tríceps", tri_oh: "Tríceps (cabeza larga)",
  squat: "Cuádriceps y glúteos", lunge: "Cuádriceps y glúteos", quad_iso: "Cuádriceps", hip_ext: "Glúteos y femorales",
  ham_curl: "Femorales", abductor: "Glúteo medio", adductor: "Aductores", calf: "Pantorrillas", core: "Abdomen"
};

/* ---------- biblioteca ---------- */
const EX = {};
EX_RAW.forEach(([id, name, cat, pat, tier, req, wr, steps, errors]) => {
  EX[id] = { id, name, cat, pat, tier, req, wr, steps, errors, muscles: PAT[pat] || "" };
});
function equipText(e){
  if(e.equip) return e.equip;
  return e.req && e.req.length ? e.req.map(r => EQUIP[r] ? EQUIP[r].name : r).join(" + ") : "Peso corporal";
}

/* ---------- prescripción (series/reps/descanso) ---------- */
const LEVELS = {
  principiante: { name: "Nuevo", icon: "🌱", desc: "Llevo menos de 6 meses entrenando o nunca he ido al gym.", mult: 0.55,
    t: { 1: [3, "8–10", 120], 2: [3, "10–12", 90], 3: [2, "12–15", 60] }, rir: "Termina cada serie sintiendo que podías hacer 2–3 repeticiones más. Primero aprende la técnica." },
  intermedio: { name: "Medio", icon: "🔥", desc: "Llevo de 6 meses a 2 años entrenando seguido.", mult: 0.85,
    t: { 1: [4, "6–8", 150], 2: [3, "8–12", 105], 3: [3, "10–15", 60] }, rir: "Termina cada serie a 1–2 repeticiones del fallo." },
  avanzado: { name: "Experto", icon: "⚡", desc: "Llevo más de 2 años, conozco los ejercicios y mi técnica es buena.", mult: 1.15,
    t: { 1: [4, "5–8", 180], 2: [4, "8–10", 120], 3: [3, "10–15", 60] }, rir: "Compuestos a 0–1 repeticiones del fallo; última serie de aislamientos al fallo." }
};
const GOALS = {
  musculo: { name: "Ganar músculo", short: "Músculo", icon: "💪", desc: "Verme más grande y marcado." },
  fuerza: { name: "Ganar fuerza", short: "Fuerza", icon: "🏋️", desc: "Levantar más peso en los básicos." },
  definir: { name: "Definir / bajar grasa", short: "Definición", icon: "🔥", desc: "Más repeticiones y descansos cortos." },
  salud: { name: "Salud y condición", short: "Salud", icon: "❤️", desc: "Sentirme bien sin matarme." }
};
function prescribe(ex, level, goal){
  const L = LEVELS[level] || LEVELS.principiante;
  let [sets, reps, rest] = L.t[ex.tier] || L.t[3];
  if(goal === "fuerza" && ex.tier === 1){ reps = { principiante: "6–8", intermedio: "4–6", avanzado: "3–5" }[level] || reps; rest += 60; }
  if(goal === "fuerza" && ex.tier === 3) sets = Math.max(2, sets - 1);
  if(goal === "definir"){ reps = { 1: "8–12", 2: "12–15", 3: "15–20" }[ex.tier]; rest = Math.round(rest * 0.7 / 15) * 15; }
  if(goal === "salud"){ sets = Math.min(sets, 3); reps = { 1: "10–12", 2: "12–15", 3: "12–15" }[ex.tier]; rest = Math.min(rest, 90); }
  if(ex.pat === "core"){ reps = ex.id === "Plank" ? "30–45 s" : "12–15"; rest = 45; sets = Math.min(sets, 3); }
  if(ex.wr === 0 && ex.pat !== "core" && ex.tier <= 2) reps = level === "principiante" ? "Las que puedas (máx. 10)" : reps;
  return { sets, reps, rest };
}

/* ---------- peso sugerido ---------- */
function suggestWeight(id, profile){
  const e = EX[id]; if(!e || !profile || !profile.weight) return null;
  if(!e.wr) return { kg: 0, label: "Tu peso corporal" };
  const L = LEVELS[profile.level] || LEVELS.principiante;
  const lower = e.cat === "pierna";
  const sexM = profile.sex === "mujer" ? (lower ? 0.75 : 0.55) : 1;
  const goalM = profile.goal === "fuerza" ? 1.1 : profile.goal === "definir" ? 0.85 : profile.goal === "salud" ? 0.8 : 1;
  let kg = profile.weight * e.wr * L.mult * sexM * goalM;
  const db = e.req.includes("mancuernas") && !e.req.includes("barra");
  const bar = e.req.includes("barra") || e.req.includes("barra_z");
  if(db){ kg = Math.max(2, Math.round(kg)); return { kg, label: `${kg} kg por mancuerna` }; }
  if(bar){ kg = Math.max(e.req.includes("barra_z") ? 10 : 20, Math.round(kg / 2.5) * 2.5); return { kg, label: `${kg} kg en total (con barra)` }; }
  kg = Math.max(5, Math.round(kg / 5) * 5);
  return { kg, label: `${kg} kg aprox. (varía según la máquina)` };
}

/* ---------- generador ---------- */
const TEMPLATES = {
  push:   { title: "Empuje", type: "empuje", focus: "Pecho · Hombro · Tríceps", slots: [["press_h",1],["press_inc",1],["press_v",1],["fly",3],["lateral",3],["tri",3],["tri_oh",3],["tri_c",2]] },
  pull:   { title: "Tirón", type: "tiron", focus: "Espalda · Bíceps", slots: [["vpull",1],["hrow",1],["hrow",2],["vpull",2],["rear",3],["bi",3],["bi_h",3],["shrug",3]] },
  legs_q: { title: "Pierna", type: "pierna", focus: "Cuádriceps · Femoral · Pantorrilla", slots: [["squat",1],["squat",2],["lunge",2],["quad_iso",3],["ham_curl",3],["calf",3],["core",3],["adductor",3]] },
  legs_p: { title: "Pierna posterior", type: "pierna", focus: "Femoral · Glúteo · Cuádriceps", slots: [["hinge",1],["hip_ext",2],["ham_curl",3],["squat",2],["lunge",2],["calf",3],["abductor",3],["core",3]] },
  upper:  { title: "Torso", type: "torso", focus: "Pecho · Espalda · Hombro · Brazos", slots: [["press_h",1],["hrow",1],["press_v",1],["vpull",1],["lateral",3],["bi",3],["tri",3],["fly",3]] },
  lower:  { title: "Pierna", type: "pierna", focus: "Cuádriceps · Femoral · Glúteo", slots: [["squat",1],["hinge",1],["lunge",2],["quad_iso",3],["ham_curl",3],["calf",3],["core",3]] },
  full_a: { title: "Cuerpo completo A", type: "full", focus: "Todo el cuerpo", slots: [["squat",1],["press_h",1],["vpull",1],["hinge",2],["lateral",3],["bi",3],["tri",3],["core",3]] },
  full_b: { title: "Cuerpo completo B", type: "full", focus: "Todo el cuerpo", slots: [["hinge",1],["press_inc",1],["hrow",1],["lunge",2],["press_v",2],["calf",3],["core",3]] },
  full_c: { title: "Cuerpo completo C", type: "full", focus: "Todo el cuerpo", slots: [["squat",2],["press_v",1],["hrow",2],["press_h",2],["ham_curl",3],["rear",3],["bi_h",3]] }
};
// días de la semana: 0 = domingo … 6 = sábado
const SPLITS = {
  2: { name: "Cuerpo completo ×2", days: [[1,"full_a"],[4,"full_b"]] },
  3: { name: "Cuerpo completo ×3", days: [[1,"full_a"],[3,"full_b"],[5,"full_c"]] },
  4: { name: "Torso / Pierna ×2", days: [[1,"upper"],[2,"lower"],[4,"upper"],[5,"lower"]] },
  5: { name: "Empuje · Tirón · Pierna + Torso · Pierna", days: [[1,"push"],[2,"pull"],[3,"legs_q"],[5,"upper"],[6,"lower"]] },
  6: { name: "Empuje · Tirón · Pierna ×2", days: [[1,"push"],[2,"pull"],[3,"legs_q"],[4,"push"],[5,"pull"],[6,"legs_p"]] }
};
const FALLBACK = {
  press_inc: ["press_h"], press_h: ["press_inc"], fly: ["press_inc","press_h"], press_v: ["lateral"], lateral: ["press_v","front"],
  rear: ["hrow"], tri: ["tri_oh","tri_c"], tri_oh: ["tri","tri_c"], tri_c: ["tri"], bi: ["bi_h"], bi_h: ["bi"],
  vpull: ["pullover","hrow"], hrow: ["vpull"], shrug: ["rear"], squat: ["lunge"], lunge: ["squat"], quad_iso: ["lunge","squat"],
  hinge: ["hip_ext","back_ext"], hip_ext: ["hinge"], ham_curl: ["hinge"], calf: [], core: [], abductor: ["hip_ext"], adductor: []
};
const PER_DURATION = { 45: 5, 60: 6, 75: 7, 90: 8 };

function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

function generateRoutine(opts){
  // opts: {equipment[], level, goal, daysPerWeek, duration, name}
  const have = new Set(opts.equipment || []);
  const avail = Object.values(EX).filter(e => !e.custom && e.req.every(r => have.has(r)));
  const split = SPLITS[opts.daysPerWeek] || SPLITS[3];
  const nEx = PER_DURATION[opts.duration] || 6;
  const used = {}; // veces que se usó cada ejercicio en la semana (para variar)
  const rand = rng(Date.now());
  const days = split.days.map(([wd, tk]) => {
    const T = TEMPLATES[tk], list = [], inDay = new Set(), dayGear = new Set();
    for(const [pat, tier] of T.slots){
      if(list.length >= nEx) break;
      const pats = [pat, ...(FALLBACK[pat] || [])];
      let best = null, bestScore = Infinity;
      pats.forEach((p, pi) => avail.filter(e => e.pat === p && !inDay.has(e.id)).forEach(e => {
        let sc = pi * 20 + Math.abs(e.tier - tier) * 6 + (used[e.id] || 0) * 9 + rand() * 3;
        if(opts.level === "principiante" && e.req.includes("barra")) sc += e.tier === 1 ? 3 : 6;   // primero máquinas/mancuernas
        if(e.req.some(r => !r.startsWith("banco") && dayGear.has(pat + ":" + r))) sc += 7;          // no repetir la misma máquina para el mismo patrón
        if(opts.level === "avanzado" && e.req.includes("barra") && e.tier === 1) sc -= 2;
        if(e.wr === 0 && opts.level === "principiante" && e.tier <= 2) sc += 4;                  // dominadas/fondos son difíciles al inicio
        if(sc < bestScore){ bestScore = sc; best = e; }
      }));
      if(!best) continue;
      const item = { id: best.id, ...prescribe(best, opts.level, opts.goal) };
      if(list.length >= 4 && dayTime({ list: [...list, item] }) > (opts.duration || 60) + 3) continue;   // respetar el tiempo
      best.req.forEach(r => dayGear.add(pat + ":" + r));
      inDay.add(best.id); used[best.id] = (used[best.id] || 0) + 1;
      list.push(item);
    }
    return { wd, title: T.title, type: T.type, focus: T.focus, list };
  });
  // si dos días comparten título, numerarlos (A/B)
  const seen = {};
  days.forEach(d => { seen[d.title] = (seen[d.title] || 0) + 1; });
  const cnt = {};
  days.forEach(d => { if(seen[d.title] > 1 && !/ [ABC]$/.test(d.title)){ cnt[d.title] = (cnt[d.title] || 0) + 1; d.title += " " + "AB"[cnt[d.title] - 1]; } });
  return {
    id: "r" + Date.now().toString(36), name: opts.name || "Mi rutina", source: "gym", createdAt: Date.now(),
    meta: { level: opts.level, goal: opts.goal, daysPerWeek: opts.daysPerWeek, duration: opts.duration, split: split.name },
    days
  };
}
const dayTime = d => Math.round(d.list.reduce((a, x) => a + x.sets * (45 + x.rest), 0) / 60 + 8);
