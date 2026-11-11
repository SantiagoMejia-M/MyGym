// MyGym — pantallas y navegación.
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $("#view");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtRest = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s / 60} min`) : `${s} s`;
const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const WD = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WD_SHORT = ["D", "L", "M", "X", "J", "V", "S"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const ICON = { empuje: "🔥", tiron: "⚡", pierna: "🦵", torso: "💪", full: "⭐", custom: "🏋️", descanso: "😴" };
const TYPE_NAME = { empuje: "Empuje", tiron: "Tirón", pierna: "Pierna", torso: "Torso", full: "Cuerpo completo", custom: "Otro" };
const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#1e212b"/><text x="150" y="118" font-size="70" text-anchor="middle">🏋️</text></svg>');

const S = () => Store.s;
const save = () => Store.save();
function X(id){
  if(EX[id]) return EX[id];
  const c = S().customEx[id];
  return c ? { id, custom: true, req: [], wr: 0, tier: 3, pat: "", ...c } : null;
}
function img(id, f){
  const e = X(id);
  if(e && e.custom) return (CUSTOM_IMG[id] && (CUSTOM_IMG[id][f] || CUSTOM_IMG[id][0])) || PLACEHOLDER;
  return `img/${id}/${f}.jpg`;
}
function toast(t){
  const d = document.createElement("div"); d.className = "toast"; d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2200);
}
function topBar(title, back, action){
  return `<div class="top">${back ? `<button class="back press" data-go="${back}" aria-label="Atrás">‹</button>` : ""}<h1>${esc(title)}</h1>${action || ""}</div>`;
}
function ring(p, label){
  const r = 18, C = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="${r}"/><circle class="fg" cx="22" cy="22" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}"/><text x="22" y="22">${label}</text></svg>`;
}
function animBox(id){
  return `<div class="anim" data-anim>
    <img src="${img(id, 0)}" alt="Inicio del movimiento"><img class="f1" src="${img(id, 1)}" alt="Final del movimiento">
    <div class="lb"><span class="a">1 · INICIO</span><span class="b">2 · FINAL</span></div><div class="pp">❚❚</div></div>`;
}
function setTab(t){
  document.body.classList.toggle("noTabs", !t);
  $$("#tabs a").forEach(a => a.classList.toggle("on", a.dataset.t === t));
}
const go = h => { location.hash = h; };
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if(g){ go(g.dataset.go); return; }
  const a = e.target.closest("[data-anim]");
  if(a){ a.classList.toggle("paused"); a.querySelector(".pp").textContent = a.classList.contains("paused") ? "▶" : "❚❚"; }
});

/* ---------- rutinas: ayudantes ---------- */
const routine = rid => S().routines.find(r => r.id === rid);
const active = () => routine(S().activeId) || null;
const doneKey = (rid, di, exId) => `${weekId()}|${rid}|${di}|${exId}`;
const getDone = (rid, di, exId) => S().done[doneKey(rid, di, exId)] || [];
function setDone(rid, di, exId, v){ S().done[doneKey(rid, di, exId)] = v; save(); }
function dayProg(r, di){
  let tot = 0, ok = 0;
  r.days[di].list.forEach(x => { tot += x.sets; ok += Math.min(x.sets, getDone(r.id, di, x.id).filter(Boolean).length); });
  return { tot, ok, pct: tot ? ok / tot : 0 };
}
const totalSets = d => d.list.reduce((a, x) => a + x.sets, 0);
const sortDays = r => r.days.sort((a, b) => WEEK_ORDER.indexOf(a.wd) - WEEK_ORDER.indexOf(b.wd));
const levelOf = r => (r && r.meta && r.meta.level) || S().profile.level || "principiante";
function suggestion(id, r){
  const p = S().profile;
  return suggestWeight(id, { ...p, level: levelOf(r), goal: (r && r.meta && r.meta.goal) || p.goal });
}
const lastW = id => S().weights[id] || [];
const best = id => S().best[id] || 0;
function saveW(id, i, w){
  const a = lastW(id).slice(); a[i] = w; S().weights[id] = a;
  const n = parseFloat(w); if(n > best(id)) S().best[id] = n;
}

/* ---------- descarga del APK (solo Android, fuera de la app instalada) ---------- */
const APK_URL = "downloads/MyGym.apk";
let apkOk = null;
const isAndroid = /Android/i.test(navigator.userAgent);
const isInstalled = () => matchMedia("(display-mode: standalone)").matches || document.referrer.startsWith("android-app://");
function apkBanner(){ return `<div id="apkBox"></div>`; }
async function fillApk(){
  const box = $("#apkBox"); if(!box || !isAndroid || isInstalled()) return;
  if(apkOk === null){ try{ apkOk = (await fetch(APK_URL, { method: "HEAD", cache: "no-store" })).ok; }catch(e){ apkOk = false; } }
  if(apkOk && $("#apkBox")) $("#apkBox").innerHTML = `<a class="btn ghost press" href="${APK_URL}" download="MyGym.apk" style="margin-top:12px">📲 Descargar app para Android</a>`;
}

/* =================================================================== */
/*                               CUENTAS                               */
/* =================================================================== */
function authShell(inner){
  setTab(null);
  view.innerHTML = `<div class="auth t-brand"><div class="logo"><img src="icons/icon-192.png" alt=""><b>MyGym</b></div>${inner}${apkBanner()}</div>`;
  fillApk();
}
function localNote(){ return CLOUD ? "" : `<div class="localnote">🔒 Modo local: tu cuenta y tus datos se guardan solo en este celular.</div>`; }
function bindAuthForm(fn){
  const f = $("#af"), errBox = $("#aerr");
  $$(".eye").forEach(b => b.onclick = () => { const i = b.parentElement.querySelector("input"); i.type = i.type === "password" ? "text" : "password"; });
  f.onsubmit = async e => {
    e.preventDefault(); errBox.innerHTML = "";
    const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
    try{ await fn(new FormData(f)); }
    catch(err){ errBox.innerHTML = `<div class="err">${esc(authError(err))}</div>`; btn.disabled = false; }
  };
  const g = $("#gbtn");
  if(g) g.onclick = async () => { try{ await Auth.google(); }catch(err){ errBox.innerHTML = `<div class="err">${esc(authError(err))}</div>`; } };
}
const googleBtn = () => CLOUD ? `<div class="or">o</div><button class="btn google press" id="gbtn" type="button"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>` : "";

function viewLogin(){
  authShell(`<h2>¡Qué onda! 👋</h2><p class="sub">Inicia sesión para ver tus rutinas y tu progreso.</p>
    <div id="aerr"></div>
    <form id="af" autocomplete="on">
      <div class="field"><span class="ic">✉️</span><input name="email" type="email" placeholder="Correo" required autocomplete="email"></div>
      <div class="field"><span class="ic">🔑</span><input name="pass" type="password" placeholder="Contraseña" required autocomplete="current-password"><button type="button" class="eye" aria-label="Ver contraseña">👁️</button></div>
      <button class="btn main press" type="submit">Iniciar sesión</button>
    </form>
    ${googleBtn()}
    ${CLOUD ? `<div class="switch"><a href="#/recuperar">¿Olvidaste tu contraseña?</a></div>` : ""}
    <div class="switch">¿No tienes cuenta? <a href="#/registro">Regístrate gratis</a></div>${localNote()}`);
  bindAuthForm(async fd => { await Auth.login(fd.get("email"), fd.get("pass")); await afterLogin(); });
}
function viewRegistro(){
  authShell(`<h2>Crea tu cuenta 💪</h2><p class="sub">Guarda tus rutinas, pesos y progreso.</p>
    <div id="aerr"></div>
    <form id="af">
      <div class="field"><span class="ic">🙂</span><input name="name" placeholder="Tu nombre" required maxlength="40" autocomplete="given-name"></div>
      <div class="field"><span class="ic">✉️</span><input name="email" type="email" placeholder="Correo" required autocomplete="email"></div>
      <div class="field"><span class="ic">🔑</span><input name="pass" type="password" placeholder="Contraseña (mín. 6)" required minlength="6" autocomplete="new-password"><button type="button" class="eye" aria-label="Ver contraseña">👁️</button></div>
      <button class="btn main press" type="submit">Crear cuenta</button>
    </form>
    ${googleBtn()}
    <div class="switch">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></div>${localNote()}`);
  bindAuthForm(async fd => {
    if(String(fd.get("pass")).length < 6) throw new Error("auth/weak-password");
    const u = await Auth.register(String(fd.get("name")).trim(), fd.get("email"), fd.get("pass"));
    if(!CLOUD) await afterLogin(u);
  });
}
function viewRecuperar(){
  authShell(`<h2>Recupera tu acceso</h2><p class="sub">Te mandamos un correo para crear una contraseña nueva.</p>
    <div id="aerr"></div>
    <form id="af"><div class="field"><span class="ic">✉️</span><input name="email" type="email" placeholder="Correo" required></div>
      <button class="btn main press" type="submit">Enviar correo</button></form>
    <div class="switch"><a href="#/login">‹ Volver</a></div>`);
  bindAuthForm(async fd => { await Auth.reset(fd.get("email")); $("#aerr").innerHTML = `<div class="note">📬 Listo. Revisa tu correo (y la carpeta de spam).</div>`; });
}
async function afterLogin(u){
  u = u || Auth.user; if(!u) return;
  view.innerHTML = `<div class="gen"><div class="spin"></div><p>Cargando tus datos…</p></div>`;
  await Store.load(u);
  go(S().onboarded ? "#/" : "#/bienvenida"); route();
}

/* ---------- datos iniciales ---------- */
function viewBienvenida(){
  setTab(null);
  const p = S().profile;
  view.innerHTML = `<main class="t-brand form" style="padding-top:calc(24px + env(safe-area-inset-top))">
    <div class="wtitle">Cuéntanos de ti${p.name ? ", " + esc(p.name.split(" ")[0]) : ""} 👋</div>
    <div class="wsub">Lo usamos para sugerirte pesos y armar rutinas a tu medida. Puedes cambiarlo después.</div>
    <label>Nombre</label><input id="pn" value="${esc(p.name)}" maxlength="40" placeholder="Tu nombre">
    <label>Sexo</label>
    <div class="seg" style="grid-template-columns:1fr 1fr">${[["hombre","👨 Hombre"],["mujer","👩 Mujer"]].map(([k, v]) => `<button type="button" data-sex="${k}" class="${p.sex === k ? "on" : ""}">${v}</button>`).join("")}</div>
    <div class="three">
      <div><label>Edad</label><div class="unit"><input id="pa" inputmode="numeric" value="${p.age || ""}" placeholder="25"><span>años</span></div></div>
      <div><label>Peso</label><div class="unit"><input id="pw" inputmode="decimal" value="${p.weight || ""}" placeholder="70"><span>kg</span></div></div>
      <div><label>Altura</label><div class="unit"><input id="ph" inputmode="numeric" value="${p.height || ""}" placeholder="170"><span>cm</span></div></div>
    </div>
    <div id="perr" style="margin-top:14px"></div>
    <div class="sticky-bottom"><button class="btn main press" id="pgo">Continuar ›</button></div>
  </main>`;
  let sex = p.sex;
  $$("[data-sex]").forEach(b => b.onclick = () => { sex = b.dataset.sex; $$("[data-sex]").forEach(x => x.classList.toggle("on", x === b)); });
  $("#pgo").onclick = () => {
    const w = parseFloat($("#pw").value), a = parseInt($("#pa").value), h = parseInt($("#ph").value);
    const name = $("#pn").value.trim();
    if(!name || !sex || !(w >= 30 && w <= 250)){ $("#perr").innerHTML = `<div class="err">Pon tu nombre, sexo y un peso válido (30–250 kg).</div>`; return; }
    Object.assign(p, { name, sex, weight: w, age: a || 0, height: h || 0 });
    const was = S().onboarded; S().onboarded = true; save();
    go(was ? "#/perfil" : "#/");
  };
}

/* =================================================================== */
/*                                 HOY                                 */
/* =================================================================== */
function viewHoy(){
  setTab("hoy");
  const p = S().profile, r = active();
  const h = new Date().getHours();
  const hi = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const first = esc((p.name || "").split(" ")[0]);
  if(!r){
    view.innerHTML = `<main style="padding-top:calc(18px + env(safe-area-inset-top))">
      <div class="hello">${hi}${first ? ", " + first : ""} 💪<small>Vamos a armar tu plan.</small></div>
      <div class="card empty" style="margin-top:18px"><span class="e">📋</span><b style="color:var(--text);font-size:18px">Aún no tienes rutinas</b><br>Crea una y aquí verás qué te toca entrenar cada día.</div>
      ${createCards()}</main>`;
    return;
  }
  const wdToday = new Date().getDay();
  const di = r.days.findIndex(d => d.wd === wdToday);
  const week = WEEK_ORDER.map(wd => {
    const i = r.days.findIndex(d => d.wd === wd), d = r.days[i];
    if(!d) return `<div class="wd rest ${wd === wdToday ? "today t-descanso" : ""}"><div class="dot">${WD_SHORT[wd]}</div>${WD[wd].slice(0, 3)}</div>`;
    const done = d.list.length && dayProg(r, i).pct >= 1;
    return `<a href="#/r/${r.id}/${i}" class="wd t-${d.type} ${wd === wdToday ? "today" : ""} ${done ? "done" : ""}"><div class="dot">${done ? "✓" : WD_SHORT[wd]}</div>${WD[wd].slice(0, 3)}</a>`;
  }).join("");
  let hero;
  if(di < 0){
    const nx = WEEK_ORDER.map(w => (w - wdToday + 7) % 7).map((_, k) => (wdToday + k + 1) % 7).map(w => r.days.find(d => d.wd === w)).find(Boolean);
    hero = `<div class="hero t-descanso"><div class="emo">😴</div><div class="kicker">Hoy</div><h2>Descanso</h2>
      <div class="focus">El músculo crece descansando. Come bien, duerme 7–9 h y toma agua.</div>
      ${nx ? `<a class="btn ghost press t-${nx.type}" href="#/r/${r.id}/${r.days.indexOf(nx)}">Siguiente: ${WD[nx.wd]} · ${ICON[nx.type]} ${esc(nx.title)} ›</a>` : ""}</div>`;
  } else {
    const d = r.days[di], pr = dayProg(r, di);
    hero = `<div class="hero t-${d.type}"><div class="emo">${ICON[d.type]}</div>
      <div class="kicker">Hoy toca</div><h2>${esc(d.title)}</h2><div class="focus">${esc(d.focus || "")}</div>
      ${d.list.length ? `<div class="strip">${d.list.map(x => `<img src="${img(x.id, 1)}" alt="" loading="lazy">`).join("")}</div>
      <div class="bigstats"><div><b>${d.list.length}</b><span>Ejercicios</span></div><div><b>${totalSets(d)}</b><span>Series</span></div><div><b>${dayTime(d)}'</b><span>Minutos</span></div></div>
      <a class="btn main press" href="#/w/${r.id}/${di}">${pr.ok ? (pr.pct >= 1 ? "✓ ¡Completado! Repasar" : `▶ CONTINUAR (${pr.ok}/${pr.tot})`) : "▶ EMPEZAR ENTRENAMIENTO"}</a>` :
      `<div class="note">Este día aún no tiene ejercicios.</div>`}
      <a class="btn ghost press" href="#/r/${r.id}/${di}">Ver ejercicios</a></div>`;
  }
  const wk = S().history.filter(x => x.week === weekId() && x.rid === r.id).length;
  view.innerHTML = `<main style="padding-top:calc(18px + env(safe-area-inset-top))">
    <div class="hello">${hi}${first ? ", " + first : ""} 💪<small>${WD[wdToday]} · ${esc(r.name)} · ${wk}/${r.days.length} entrenos esta semana</small></div>
    <div class="week">${week}</div>${hero}</main>`;
}
function createCards(){
  return `<div class="label">Crear rutina</div>
    <a class="create hot press" href="#/crear/gym"><div class="ic">🤖</div><div><div class="badge">RECOMENDADO</div><b>Crear rutina con MI gym</b><span>Marca las máquinas que hay en tu gym, tu nivel y tus días. Te armamos la rutina con series, reps y pesos sugeridos.</span></div></a>
    <a class="create press" href="#/crear/manual"><div class="ic">✍️</div><div><b>Crear rutina por mi cuenta</b><span>Tú eliges los días y todos los ejercicios de una biblioteca con más de 130, cada uno con su animación.</span></div></a>`;
}

/* =================================================================== */
/*                               RUTINAS                               */
/* =================================================================== */
function viewRutinas(){
  setTab("rutinas");
  const rs = S().routines;
  view.innerHTML = topBar("Mis rutinas") + `<main>
    ${rs.length ? rs.map(r => {
      const isA = r.id === S().activeId;
      const bars = r.days.map((d, i) => `<i class="${d.list.length && dayProg(r, i).pct >= 1 ? "on" : ""}"></i>`).join("");
      return `<a class="routine press ${isA ? "active" : ""}" href="#/r/${r.id}"><div class="go">›</div>
        ${isA ? `<div class="pill-active">● ACTIVA</div>` : ""}
        <div class="name">${esc(r.name)}</div>
        <div class="sub">${r.days.length} días · ${r.source === "gym" ? "🤖 Con mi gym" : "✍️ Hecha por mí"}${r.meta && r.meta.level ? " · " + LEVELS[r.meta.level].name : ""}</div>
        <div class="bars">${bars}</div></a>`;
    }).join("") : `<div class="card empty"><span class="e">📋</span>Aún no tienes rutinas.</div>`}
    ${createCards()}</main>`;
}

/* ---------- crear manual ---------- */
function viewCrearManual(){
  setTab(null);
  const sel = new Set([1, 3, 5]);
  view.innerHTML = topBar("Rutina por mi cuenta", "#/rutinas") + `<main class="t-custom form">
    <div class="wsub" style="margin-top:4px">Ponle nombre y elige qué días vas a entrenar. Después agregas los ejercicios de cada día.</div>
    <label>Nombre de la rutina</label><input id="rn" maxlength="40" placeholder="Ej. Mi rutina de volumen" value="Mi rutina">
    <label>Días que entrenas</label>
    <div class="wdpick">${WEEK_ORDER.map(w => `<button type="button" data-w="${w}" class="${sel.has(w) ? "on" : ""}">${WD_SHORT[w]}</button>`).join("")}</div>
    <div class="hint" id="wdc"></div>
    <div class="sticky-bottom"><button class="btn main press" id="mk">Crear rutina ›</button></div></main>`;
  const upd = () => { $("#wdc").textContent = `${sel.size} día${sel.size === 1 ? "" : "s"}: ` + WEEK_ORDER.filter(w => sel.has(w)).map(w => WD[w]).join(", "); $("#mk").disabled = !sel.size; };
  $$("[data-w]").forEach(b => b.onclick = () => { const w = +b.dataset.w; sel.has(w) ? sel.delete(w) : sel.add(w); b.classList.toggle("on"); upd(); });
  upd();
  $("#mk").onclick = () => {
    const r = { id: "r" + Date.now().toString(36), name: $("#rn").value.trim() || "Mi rutina", source: "manual", createdAt: Date.now(), meta: {},
      days: WEEK_ORDER.filter(w => sel.has(w)).map((w, i) => ({ wd: w, title: `Día ${i + 1}`, type: "custom", focus: "", list: [] })) };
    S().routines.push(r); S().activeId = r.id; save();
    toast("Rutina creada ✓ Ahora agrega ejercicios");
    go(`#/r/${r.id}`);
  };
}

/* ---------- asistente "con mi gym" ---------- */
let W = null;
function newWizard(){
  const p = S().profile;
  return { step: 1, eq: new Set(p.equipment || []), level: p.level || "", goal: p.goal || "", days: 4, duration: 60, wds: null, q: "" };
}
function viewGym(){
  setTab(null);
  if(!W) W = newWizard();
  const total = 4;
  const head = (t, s) => `<div class="steps">${Array.from({ length: total }, (_, i) => `<i class="${i < W.step ? "on" : ""}"></i>`).join("")}</div><div class="wtitle">${t}</div><div class="wsub">${s}</div>`;
  const back = W.step > 1 ? "" : "#/rutinas";
  view.innerHTML = topBar(`Paso ${W.step} de ${total}`, back || "#/", `<button class="act" id="wx">✕</button>`) + `<main class="t-brand" id="wz"></main>`;
  $(".top .back").onclick = e => { e.stopPropagation(); if(W.step > 1){ W.step--; viewGym(); } else { W = null; go("#/rutinas"); } };
  $("#wx").onclick = () => { W = null; go("#/rutinas"); };
  const z = $("#wz");
  if(W.step === 1){
    z.innerHTML = head("¿Qué hay en tu gym?", "Toca todo lo que tenga tu gym. Si no sabes el nombre, guíate por la foto.") +
      `<div class="presets">${EQUIP_PRESETS.map(p => `<button class="press" data-pre="${p.id}"><span class="e">${p.icon}</span>${p.name}<small>${p.desc}</small></button>`).join("")}</div>
      <input class="search" id="eqq" placeholder="🔍 Buscar por nombre (ej. prensa, smith, poleas…)" value="${esc(W.q)}">
      <div id="eqg"></div>
      <div class="sticky-bottom"><button class="btn main press" id="nx"></button></div>`;
    equipGrid($("#eqg"), W.eq, () => updNext(), () => W.q);
    const updNext = () => { const n = W.eq.size; $("#nx").disabled = !n; $("#nx").innerHTML = n ? `Continuar con ${n} equipo${n === 1 ? "" : "s"} ›` : "Marca al menos 1"; };
    $("#eqq").oninput = e => { W.q = e.target.value; equipGrid($("#eqg"), W.eq, updNext, () => W.q); };
    $$("[data-pre]").forEach(b => b.onclick = () => { const p = EQUIP_PRESETS.find(x => x.id === b.dataset.pre); W.eq = new Set(p.items); equipGrid($("#eqg"), W.eq, updNext, () => W.q); updNext(); toast(`${p.icon} ${p.name}: ${p.items.length} equipos marcados`); });
    updNext();
    $("#nx").onclick = () => { W.step = 2; viewGym(); };
  } else if(W.step === 2){
    z.innerHTML = head("¿Cuál es tu nivel?", "Con esto ajustamos los ejercicios, las series y los pesos sugeridos.") +
      Object.entries(LEVELS).map(([k, L]) => `<button class="choice press ${W.level === k ? "on" : ""}" data-l="${k}"><div class="ic">${L.icon}</div><div><b>${L.name}</b><span>${L.desc}</span></div></button>`).join("") +
      `<div class="sticky-bottom"><button class="btn main press" id="nx" ${W.level ? "" : "disabled"}>Continuar ›</button></div>`;
    $$("[data-l]").forEach(b => b.onclick = () => { W.level = b.dataset.l; $$("[data-l]").forEach(x => x.classList.toggle("on", x === b)); $("#nx").disabled = false; });
    $("#nx").onclick = () => { W.step = 3; viewGym(); };
  } else if(W.step === 3){
    z.innerHTML = head("¿Qué quieres lograr?", "Cambia las repeticiones, los descansos y la intensidad.") +
      Object.entries(GOALS).map(([k, G]) => `<button class="choice press ${W.goal === k ? "on" : ""}" data-g="${k}"><div class="ic">${G.icon}</div><div><b>${G.name}</b><span>${G.desc}</span></div></button>`).join("") +
      `<div class="sticky-bottom"><button class="btn main press" id="nx" ${W.goal ? "" : "disabled"}>Continuar ›</button></div>`;
    $$("[data-g]").forEach(b => b.onclick = () => { W.goal = b.dataset.g; $$("[data-g]").forEach(x => x.classList.toggle("on", x === b)); $("#nx").disabled = false; });
    $("#nx").onclick = () => { W.step = 4; viewGym(); };
  } else if(W.step === 4){
    if(!W.wds || W.wds.length !== W.days) W.wds = SPLITS[W.days].days.map(d => d[0]);
    z.innerHTML = head("¿Cuántos días y cuánto tiempo?", "Elige cuántos días a la semana puedes ir y cuánto dura cada sesión.") +
      `<div class="label" style="margin-top:0">Días por semana</div>
      <div class="seg" style="grid-template-columns:repeat(5,1fr)">${[2, 3, 4, 5, 6].map(n => `<button data-d="${n}" class="${W.days === n ? "on" : ""}">${n}<small>días</small></button>`).join("")}</div>
      <div class="note" id="split"></div>
      <div class="label">¿Qué días?</div>
      <div class="wdpick">${WEEK_ORDER.map(w => `<button data-w="${w}" class="${W.wds.includes(w) ? "on" : ""}">${WD_SHORT[w]}</button>`).join("")}</div>
      <div class="hint" id="wdh"></div>
      <div class="label">Tiempo por sesión</div>
      <div class="seg" style="grid-template-columns:repeat(4,1fr)">${[45, 60, 75, 90].map(n => `<button data-t="${n}" class="${W.duration === n ? "on" : ""}">${n}<small>min</small></button>`).join("")}</div>
      <div class="sticky-bottom"><button class="btn main press" id="nx">🤖 Crear mi rutina</button></div>`;
    const upd = () => {
      $("#split").innerHTML = `📅 Tipo de rutina: <b>${SPLITS[W.days].name}</b>`;
      const ok = W.wds.length === W.days;
      $("#wdh").textContent = ok ? WEEK_ORDER.filter(w => W.wds.includes(w)).map(w => WD[w]).join(", ") : `Elige ${W.days} días (llevas ${W.wds.length}).`;
      $("#wdh").style.color = ok ? "" : "var(--bad)"; $("#nx").disabled = !ok;
    };
    $$("[data-d]").forEach(b => b.onclick = () => { W.days = +b.dataset.d; W.wds = null; viewGym(); });
    $$("[data-t]").forEach(b => b.onclick = () => { W.duration = +b.dataset.t; $$("[data-t]").forEach(x => x.classList.toggle("on", x === b)); });
    $$("[data-w]").forEach(b => b.onclick = () => { const w = +b.dataset.w, i = W.wds.indexOf(w); i >= 0 ? W.wds.splice(i, 1) : W.wds.push(w); b.classList.toggle("on"); upd(); });
    upd();
    $("#nx").onclick = () => buildFromWizard();
  }
}
function equipGrid(box, set, onChange, getQ){
  const q = (getQ() || "").toLowerCase().trim();
  const norm = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nq = norm(q);
  box.innerHTML = EQUIP_GROUPS.map(g => {
    const items = g.items.filter(i => !nq || norm(i.name + " " + i.desc + " " + i.aka).includes(nq));
    if(!items.length) return "";
    const all = items.every(i => set.has(i.id));
    return `<div class="ggrp"><b>${g.icon} ${g.name}</b><button data-all="${g.id}">${all ? "Quitar todo" : "Marcar todo"}</button></div>
      <div class="egrid">${items.map(i => `<button class="eq press ${set.has(i.id) ? "on" : ""}" data-eq="${i.id}"><div class="ph"><img src="img/${i.img}.jpg" alt="" loading="lazy"><div class="ck">✓</div></div><div class="tx"><b>${esc(i.name)}</b><span>${esc(i.desc)}</span></div></button>`).join("")}</div>`;
  }).join("") || `<div class="card empty"><span class="e">🤔</span>No encontramos ese equipo. Prueba con otra palabra o búscalo por la foto.</div>`;
  $$("[data-eq]", box).forEach(b => b.onclick = () => { const id = b.dataset.eq; set.has(id) ? set.delete(id) : set.add(id); b.classList.toggle("on"); onChange(); });
  $$("[data-all]", box).forEach(b => b.onclick = () => {
    const g = EQUIP_GROUPS.find(x => x.id === b.dataset.all), all = g.items.every(i => set.has(i.id));
    g.items.forEach(i => all ? set.delete(i.id) : set.add(i.id)); equipGrid(box, set, onChange, getQ); onChange();
  });
}
function buildFromWizard(){
  const p = S().profile;
  p.equipment = [...W.eq]; p.level = W.level; p.goal = W.goal; save();
  view.innerHTML = `<div class="gen t-brand"><div class="spin"></div><h2 style="margin:0 0 6px">Armando tu rutina…</h2><p id="gmsg">Revisando tu equipo</p></div>`;
  const msgs = ["Eligiendo los mejores ejercicios", "Calculando series y repeticiones", "Sugiriendo pesos para ti"];
  msgs.forEach((m, i) => setTimeout(() => { const e = $("#gmsg"); if(e) e.textContent = m; }, 450 * (i + 1)));
  setTimeout(() => {
    const r = generateRoutine({ equipment: [...W.eq], level: W.level, goal: W.goal, daysPerWeek: W.days, duration: W.duration, name: `${GOALS[W.goal].short} · ${W.days} días` });
    const order = WEEK_ORDER.filter(w => W.wds.includes(w));
    r.days.forEach((d, i) => { d.wd = order[i]; });
    S().draft = r; W = null;
    go("#/crear/preview");
  }, 1900);
}
function viewPreview(){
  setTab(null);
  const r = S().draft; if(!r) return go("#/crear/gym");
  const empty = r.days.filter(d => !d.list.length).length;
  view.innerHTML = topBar("Tu rutina está lista", "#/rutinas") + `<main class="t-brand">
    <div class="hero t-brand" style="margin-top:0"><div class="emo">🤖</div><div class="kicker">${esc(r.meta.split)}</div>
      <h2 style="font-size:30px">${esc(r.name)}</h2>
      <div class="focus">${LEVELS[r.meta.level].icon} ${LEVELS[r.meta.level].name} · ${GOALS[r.meta.goal].icon} ${GOALS[r.meta.goal].name} · ⏱ ${r.meta.duration} min</div>
      <div class="note" style="background:rgba(0,0,0,.25);border:0;margin:0">💡 ${esc(LEVELS[r.meta.level].rir)}</div></div>
    ${empty ? `<div class="err">Con tu equipo no alcanzó para ${empty} día(s). Puedes agregar ejercicios a mano o marcar más equipo.</div>` : ""}
    <div class="label">Tus días</div>
    ${r.days.map(d => `<div class="card t-${d.type}" style="border-left:5px solid var(--c)">
      <div class="row"><div class="grow"><div class="day" style="border:0;padding:0"><div><div class="dn" style="color:var(--c);font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase">${WD[d.wd]}</div><div style="font-size:19px;font-weight:900">${ICON[d.type]} ${esc(d.title)}</div></div></div></div><span class="chip">⏱ ${dayTime(d)} min</span></div>
      <div style="margin-top:10px">${d.list.map(x => { const sg = suggestion(x.id, r); return `<div class="row" style="padding:7px 0;border-top:1px solid var(--line)"><img src="${img(x.id, 1)}" style="width:52px;height:40px;border-radius:9px;object-fit:cover;background:#fff;flex:none" alt="" loading="lazy"><div class="grow"><div style="font-weight:800;font-size:14px;line-height:1.2">${esc(X(x.id).name)}</div><div class="muted" style="font-size:12px;font-weight:700">${x.sets} × ${esc(x.reps)} · ${fmtRest(x.rest)}${sg ? " · " + esc(sg.label) : ""}</div></div></div>`; }).join("")}</div></div>`).join("")}
    <div class="sticky-bottom">
      <button class="btn main press" id="sv">✓ Guardar y usar esta rutina</button>
      <button class="btn ghost press" id="rg">🔄 Generar otra opción</button></div></main>`;
  $("#sv").onclick = () => { S().routines.push(r); S().activeId = r.id; delete S().draft; save(); toast("¡Rutina guardada! 💪"); go("#/"); };
  $("#rg").onclick = () => {
    const p = S().profile;
    const n = generateRoutine({ equipment: p.equipment, level: r.meta.level, goal: r.meta.goal, daysPerWeek: r.meta.daysPerWeek, duration: r.meta.duration, name: r.name });
    n.days.forEach((d, i) => { d.wd = r.days[i].wd; });
    S().draft = n; viewPreview(); window.scrollTo(0, 0);
  };
}

/* ---------- una rutina ---------- */
function viewRutina(rid){
  setTab("rutinas");
  const r = routine(rid); if(!r) return go("#/rutinas");
  sortDays(r);
  const isA = r.id === S().activeId;
  view.innerHTML = topBar(r.name, "#/rutinas", `<button class="act" id="ren">✏️</button>`) + `<main>
    ${isA ? `<div class="note t-brand">● Esta es tu rutina activa: la ves en "Hoy".</div>` : `<button class="btn main press t-brand" id="act">Usar esta rutina</button>`}
    ${r.meta && r.meta.level ? `<div style="margin-bottom:6px"><span class="chip">${LEVELS[r.meta.level].icon} ${LEVELS[r.meta.level].name}</span>${r.meta.goal ? `<span class="chip">${GOALS[r.meta.goal].icon} ${GOALS[r.meta.goal].name}</span>` : ""}${r.meta.split ? `<span class="chip">📅 ${esc(r.meta.split)}</span>` : ""}</div>` : ""}
    <div class="label">Semana</div>
    ${WEEK_ORDER.map(wd => {
      const i = r.days.findIndex(d => d.wd === wd), d = r.days[i];
      if(!d) return `<button class="card day rest t-descanso press" style="width:100%;text-align:left" data-add="${wd}"><div class="ic">😴</div><div class="grow"><div class="dn">${WD[wd]}</div><div class="tt" style="font-size:16px">Descanso</div><div class="muted" style="font-size:13px">Toca para convertirlo en día de entreno</div></div></button>`;
      const pr = dayProg(r, i);
      return `<a class="card day press t-${d.type}" href="#/r/${r.id}/${i}"><div class="ic">${ICON[d.type]}</div>
        <div class="grow"><div class="dn">${WD[wd]}${wd === new Date().getDay() ? '<span class="tag-today">HOY</span>' : ""}</div><div class="tt">${esc(d.title)}</div>
        <div class="muted ell" style="font-size:13px">${d.list.length ? `${d.list.length} ejercicios · ${totalSets(d)} series · ~${dayTime(d)} min` : "Sin ejercicios aún"}</div></div>
        ${d.list.length ? ring(pr.pct, pr.pct >= 1 ? "✓" : Math.round(pr.pct * 100) + "%") : '<span style="font-size:22px">›</span>'}</a>`;
    }).join("")}
    <button class="btn danger" id="del" style="margin-top:20px">🗑 Borrar rutina</button></main>`;
  const a = $("#act"); if(a) a.onclick = () => { S().activeId = r.id; save(); toast("Rutina activada ✓"); viewRutina(rid); };
  $("#ren").onclick = () => { const n = prompt("Nombre de la rutina", r.name); if(n && n.trim()){ r.name = n.trim().slice(0, 40); save(); viewRutina(rid); } };
  $("#del").onclick = () => {
    if(!confirm(`¿Borrar "${r.name}"? No se puede deshacer.`)) return;
    S().routines = S().routines.filter(x => x.id !== rid);
    if(S().activeId === rid) S().activeId = S().routines[0] ? S().routines[0].id : null;
    save(); go("#/rutinas");
  };
  $$("[data-add]").forEach(b => b.onclick = () => {
    const wd = +b.dataset.add;
    r.days.push({ wd, title: `Día ${r.days.length + 1}`, type: "custom", focus: "", list: [] }); sortDays(r); save();
    go(`#/r/${r.id}/${r.days.findIndex(d => d.wd === wd)}/editar`);
  });
}

/* ---------- un día ---------- */
function viewDia(rid, di){
  setTab("rutinas");
  const r = routine(rid), d = r && r.days[di]; if(!d) return go("#/rutinas");
  const pr = dayProg(r, di);
  view.innerHTML = topBar(WD[d.wd], `#/r/${rid}`) + `<main class="t-${d.type}">
    <div class="dayhead"><div class="k">${ICON[d.type]} ${esc(TYPE_NAME[d.type] || "")}</div><h2>${esc(d.title)}</h2>
      ${d.focus ? `<div class="muted" style="font-weight:600;margin-bottom:12px">${esc(d.focus)}</div>` : ""}
      <span class="chip">📋 ${d.list.length} ejercicios</span><span class="chip">🔁 ${pr.tot} series</span><span class="chip">⏱ ~${dayTime(d)} min</span></div>
    ${d.list.length ? `<a class="btn main press" href="#/w/${rid}/${di}">${pr.ok ? (pr.pct >= 1 ? "✓ Completado · Repasar" : `▶ CONTINUAR (${pr.ok}/${pr.tot})`) : "▶ EMPEZAR ENTRENAMIENTO"}</a>` : ""}
    <a class="btn ghost press" href="#/r/${rid}/${di}/editar">✏️ Editar este día</a>
    ${d.list.length ? `<div class="warm">🔥<div><b>Calienta primero:</b> 5–10 min de cardio suave y 1–2 series ligeras del primer ejercicio.</div></div>` : `<div class="card empty"><span class="e">📭</span>Este día no tiene ejercicios.<br>Toca "Editar" para agregar.</div>`}
    ${d.list.map((x, ei) => {
      const e = X(x.id), dn = getDone(rid, di, x.id), ok = dn.filter(Boolean).length;
      return `<a class="card ex press ${ok >= x.sets ? "done" : ""}" href="#/r/${rid}/${di}/e/${ei}">
        <div class="ph"><img src="${img(x.id, 1)}" alt="" loading="lazy"><div class="n">${ok >= x.sets ? "✓" : ei + 1}</div></div>
        <div class="grow"><div class="nm">${esc(e.name)}</div>
          <div class="sr"><b>${x.sets} × ${esc(x.reps)}</b> · descanso ${fmtRest(x.rest)}</div>
          <div class="row" style="gap:8px"><div class="dots">${Array.from({ length: x.sets }, (_, i) => `<i class="${dn[i] === "skip" ? "sk" : dn[i] ? "on" : ""}"></i>`).join("")}</div>${e.tier === 1 ? `<span class="star">⭐ Principal</span>` : ""}</div></div>
        <div class="muted" style="font-size:22px">›</div></a>`;
    }).join("")}
    ${pr.ok ? `<button class="btn ghost" id="reset">↺ Reiniciar progreso de esta semana</button>` : ""}</main>`;
  const rs = $("#reset");
  if(rs) rs.onclick = () => { if(confirm("¿Borrar las series marcadas de este día?")){ d.list.forEach(x => delete S().done[doneKey(rid, di, x.id)]); save(); viewDia(rid, di); } };
}

/* ---------- editar día ---------- */
function viewDiaEditar(rid, di){
  setTab(null);
  const r = routine(rid), d = r && r.days[di]; if(!d) return go("#/rutinas");
  view.innerHTML = topBar(`Editar · ${WD[d.wd]}`, `#/r/${rid}/${di}`) + `<main class="t-${d.type} form">
    <label style="margin-top:4px">Nombre del día</label><input id="dt" value="${esc(d.title)}" maxlength="30">
    <label>Tipo (color)</label><div class="types">${Object.entries(TYPE_NAME).map(([k, v]) => `<button type="button" data-ty="${k}" class="t-${k} ${d.type === k ? "on" : ""}">${ICON[k]} ${v}</button>`).join("")}</div>
    <label>Ejercicios</label>
    ${d.list.map((x, ei) => `<div class="card ed"><img src="${img(x.id, 1)}" alt="">
      <div class="grow"><div class="nm">${esc(X(x.id).name)}</div>
        <div class="ctl"><button class="mini" data-a="s-" data-i="${ei}">−</button><span class="sv">${x.sets} series</span><button class="mini" data-a="s+" data-i="${ei}">+</button></div>
        <div class="ctl"><input class="mini in" value="${esc(x.reps)}" data-a="reps" data-i="${ei}" aria-label="Repeticiones"><button class="mini" data-a="r-" data-i="${ei}">−</button><span class="sv">⏱ ${fmtRest(x.rest)}</span><button class="mini" data-a="r+" data-i="${ei}">+</button></div></div>
      <div class="side"><button class="mini" data-a="up" data-i="${ei}" ${ei === 0 ? "disabled style='opacity:.3'" : ""}>▲</button><button class="mini" data-a="dn" data-i="${ei}" ${ei === d.list.length - 1 ? "disabled style='opacity:.3'" : ""}>▼</button><button class="mini del" data-a="del" data-i="${ei}">🗑</button></div></div>`).join("")}
    ${d.list.length ? "" : `<div class="card empty"><span class="e">📭</span>Sin ejercicios. Agrega abajo.</div>`}
    <a class="btn main press" href="#/r/${rid}/${di}/agregar">➕ Agregar ejercicios</a>
    <a class="btn ghost press" href="#/r/${rid}/${di}">✓ Listo</a>
    <button class="btn danger" id="rmday">Convertir en día de descanso</button></main>`;
  $("#dt").onchange = e => { d.title = e.target.value.trim() || d.title; save(); };
  $$("[data-ty]").forEach(b => b.onclick = () => { d.type = b.dataset.ty; save(); viewDiaEditar(rid, di); });
  $$("[data-a]").forEach(el => {
    const a = el.dataset.a, i = +el.dataset.i, x = d.list[i];
    if(a === "reps"){ el.onchange = () => { x.reps = el.value.trim() || x.reps; save(); }; return; }
    el.onclick = () => {
      if(a === "s-") x.sets = Math.max(1, x.sets - 1);
      if(a === "s+") x.sets = Math.min(8, x.sets + 1);
      if(a === "r-") x.rest = Math.max(15, x.rest - 15);
      if(a === "r+") x.rest = Math.min(300, x.rest + 15);
      if(a === "up") d.list.splice(i - 1, 0, d.list.splice(i, 1)[0]);
      if(a === "dn") d.list.splice(i + 1, 0, d.list.splice(i, 1)[0]);
      if(a === "del"){ if(!confirm(`¿Quitar "${X(x.id).name}"?`)) return; d.list.splice(i, 1); }
      save(); viewDiaEditar(rid, di);
    };
  });
  $("#rmday").onclick = () => { if(!confirm(`¿Quitar el ${WD[d.wd]} de la rutina? Se vuelve día de descanso.`)) return; r.days.splice(di, 1); save(); go(`#/r/${rid}`); };
}

/* ---------- biblioteca (agregar o explorar) ---------- */
let libF = "todos", libQ = "", libEq = false;
function libItems(){
  const nq = libQ.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const have = new Set(S().profile.equipment || []);
  const all = [...Object.values(EX), ...Object.keys(S().customEx).map(X)];
  return all.filter(e => {
    if(libF === "mios" && !e.custom) return false;
    if(libF !== "todos" && libF !== "mios" && e.cat !== libF) return false;
    if(libEq && !e.custom && !e.req.every(r => have.has(r))) return false;
    if(!nq) return true;
    return (e.name + " " + (e.muscles || "") + " " + equipText(e)).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(nq);
  }).sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0) || a.tier - b.tier || a.name.localeCompare(b.name));
}
function libHeader(newHref){
  const f = [["todos", "Todos"], ...Object.entries(CATS), ["mios", "⭐ Míos"]];
  return `<a class="btn main press t-custom" href="${newHref}">✨ Crear ejercicio nuevo (con tus fotos)</a>
    <input class="search" id="q" placeholder="🔍 Buscar ejercicio, músculo o máquina…" value="${esc(libQ)}">
    <div class="filters">${f.map(([k, v]) => `<button data-f="${k}" class="${libF === k ? "on" : ""}">${v}</button>`).join("")}</div>
    ${(S().profile.equipment || []).length ? `<label class="row" style="gap:10px;margin:0 2px 12px;font-weight:700;font-size:14px"><input type="checkbox" id="onlyEq" ${libEq ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--brand)"> Solo lo que hay en mi gym</label>` : ""}
    <div id="lib"></div>`;
}
function bindLib(draw){
  $("#q").oninput = e => { libQ = e.target.value; draw(); };
  $$("[data-f]").forEach(b => b.onclick = () => { libF = b.dataset.f; $$("[data-f]").forEach(x => x.classList.toggle("on", x === b)); draw(); });
  const oe = $("#onlyEq"); if(oe) oe.onchange = () => { libEq = oe.checked; draw(); };
  draw();
}
function viewAgregar(rid, di){
  setTab(null);
  const r = routine(rid), d = r && r.days[di]; if(!d) return go("#/rutinas");
  view.innerHTML = topBar("Agregar ejercicios", `#/r/${rid}/${di}/editar`) + `<main class="t-${d.type}">${libHeader(`#/nuevo-ej?r=${rid}&d=${di}`)}</main>`;
  const draw = () => {
    const items = libItems();
    $("#lib").innerHTML = items.length ? items.slice(0, 200).map(e => {
      const inDay = d.list.some(x => x.id === e.id);
      return `<div class="card lib ${inDay ? "in" : ""}"><img src="${img(e.id, 1)}" alt="" loading="lazy">
        <div class="grow"><div class="nm">${esc(e.name)}${e.custom ? '<span class="mine">MÍO</span>' : ""}</div>
          <div class="muted ell" style="font-size:12.5px;margin-top:3px">${esc(equipText(e))}</div>
          <a href="#/ej/${e.id}" style="font-size:13px;font-weight:800;color:var(--c)">Ver cómo se hace ›</a></div>
        <button class="add" data-id="${e.id}" aria-label="${inDay ? "Quitar" : "Agregar"}">${inDay ? "✓" : "+"}</button></div>`;
    }).join("") : `<div class="card empty"><span class="e">🤷</span>No hay ejercicios con ese filtro.</div>`;
    $$("#lib .add").forEach(b => b.onclick = () => {
      const id = b.dataset.id, k = d.list.findIndex(x => x.id === id);
      if(k >= 0) d.list.splice(k, 1);
      else d.list.push({ id, ...prescribe(X(id), levelOf(r), (r.meta && r.meta.goal) || S().profile.goal || "musculo") });
      save(); draw();
    });
  };
  bindLib(draw);
}
function viewEjercicios(){
  setTab("ejercicios");
  view.innerHTML = topBar("Ejercicios") + `<main class="t-brand">${libHeader("#/nuevo-ej")}</main>`;
  bindLib(() => {
    const items = libItems();
    $("#lib").innerHTML = `<div class="muted" style="font-size:13px;margin:0 2px 10px;font-weight:700">${items.length} ejercicios</div>` + items.slice(0, 200).map(e =>
      `<a class="card lib press" href="#/ej/${e.id}"><img src="${img(e.id, 1)}" alt="" loading="lazy"><div class="grow"><div class="nm">${esc(e.name)}${e.custom ? '<span class="mine">MÍO</span>' : ""}</div><div class="muted ell" style="font-size:12.5px;margin-top:3px">${esc(CATS[e.cat] || "")} · ${esc(equipText(e))}</div></div><div class="muted" style="font-size:22px">›</div></a>`).join("");
  });
}

/* ---------- detalle de ejercicio ---------- */
function howTo(e){
  return `${e.steps && e.steps.length ? `<div class="card"><div class="sec-t">Cómo se hace</div><ol class="stp">${e.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>` : ""}
    ${e.errors && e.errors.length ? `<div class="card"><div class="sec-t">Evita estos errores</div><ul class="errs">${e.errors.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    <a class="btn ghost press" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent("como hacer " + e.name + " tecnica")}">▶️ Ver video en YouTube</a>`;
}
function exInfo(e, r){
  const w = lastW(e.id).filter(Boolean), b = best(e.id), sg = suggestion(e.id, r);
  return `<div class="info"><div><i>🏋️</i>${esc(equipText(e))}</div>${e.muscles ? `<div><i>🎯</i>${esc(e.muscles)}</div>` : ""}
    ${sg && !w.length ? `<div class="sug"><i>💡</i><span>Peso sugerido para empezar: <b>${esc(sg.label)}</b>. Si terminas las reps muy fácil, sube; si no llegas, baja.</span></div>` : ""}
    ${w.length ? `<div><i>📒</i>Última vez: ${w.map(v => esc(v) + " kg").join(" · ")}${b ? ` · Récord ${b} kg` : ""}</div>` : ""}</div>`;
}
function viewEj(id){
  setTab(null);
  const e = X(id); if(!e) return go("#/ejercicios");
  view.innerHTML = topBar(CATS[e.cat] || "Ejercicio", null) + `<main class="t-brand">
    ${animBox(id)}<div class="xname">${esc(e.name)}</div>
    ${e.tier ? `<div style="margin-bottom:10px"><span class="chip">${e.tier === 1 ? "⭐ Principal" : e.tier === 2 ? "Compuesto" : "Aislamiento"}</span></div>` : ""}
    ${exInfo(e, active())}${howTo(e)}
    ${e.custom ? `<a class="btn ghost press" href="#/nuevo-ej?id=${id}">✏️ Editar mi ejercicio</a>` : ""}
    <button class="btn ghost press" onclick="history.back()">‹ Regresar</button></main>`;
  view.querySelector(".top").insertAdjacentHTML("afterbegin", `<button class="back press" onclick="history.back()" aria-label="Atrás">‹</button>`);
}
function viewEjDia(rid, di, ei){
  setTab(null);
  const r = routine(rid), d = r && r.days[di], x = d && d.list[ei]; if(!x) return go("#/rutinas");
  const e = X(x.id);
  view.innerHTML = topBar(`${ei + 1} de ${d.list.length}`, `#/r/${rid}/${di}`) + `<main class="t-${d.type}">
    ${animBox(x.id)}<div class="xname">${esc(e.name)}</div>
    <div class="trio"><div><b>${x.sets}</b><span>Series</span></div><div><b>${esc(x.reps)}</b><span>Reps</span></div><div><b>${fmtRest(x.rest)}</b><span>Descanso</span></div></div>
    ${exInfo(e, r)}${howTo(e)}
    <div class="nav2">${ei > 0 ? `<a class="btn ghost press" href="#/r/${rid}/${di}/e/${ei - 1}">‹ Anterior</a>` : "<span></span>"}${ei + 1 < d.list.length ? `<a class="btn ghost press" href="#/r/${rid}/${di}/e/${ei + 1}">Siguiente ›</a>` : "<span></span>"}</div></main>`;
}

/* ---------- ejercicio propio ---------- */
function viewNuevoEj(q){
  setTab(null);
  const rid = q.get("r"), di = q.get("d") != null ? +q.get("d") : null, editId = q.get("id");
  const r = rid ? routine(rid) : null, d = r ? r.days[di] : null;
  const e = editId ? S().customEx[editId] : null;
  const back = d ? `#/r/${rid}/${di}/agregar` : "#/ejercicios";
  const pics = editId && CUSTOM_IMG[editId] ? [...CUSTOM_IMG[editId]] : [null, null];
  view.innerHTML = topBar(e ? "Editar ejercicio" : "Ejercicio nuevo", back) + `<main class="t-custom form">
    <label style="margin-top:4px">Nombre *</label><input id="fn" placeholder="Ej. Press en máquina convergente" value="${esc(e ? e.name : "")}" maxlength="60">
    <label>Fotos o GIF (inicio y final)</label>
    <div class="pics">${[0, 1].map(i => `<div class="pic" id="pic${i}">${pics[i] ? `<img src="${pics[i]}" alt="">` : ""}<span>📷<br>${i ? "2 · Final" : "1 · Inicio"}</span><input type="file" accept="image/*" data-i="${i}"></div>`).join("")}</div>
    <div class="hint">Toma foto o elige de tu galería. Con 2 fotos se anima solo. Las fotos se guardan en este celular.</div>
    <label>Grupo muscular</label><select id="fc">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${e && e.cat === k ? "selected" : ""}>${v}</option>`).join("")}</select>
    <label>Equipo</label><input id="fe" placeholder="Ej. Polea alta + cuerda" value="${esc(e ? e.equip : "")}">
    <label>Músculos que trabaja</label><input id="fm" placeholder="Ej. Pecho y tríceps" value="${esc(e ? e.muscles : "")}">
    <label>Cómo se hace</label><textarea id="fs" placeholder="Un paso por renglón">${esc(e ? (e.steps || []).join("\n") : "")}</textarea>
    <label>Errores a evitar</label><textarea id="fx" style="min-height:80px" placeholder="Uno por renglón (opcional)">${esc(e ? (e.errors || []).join("\n") : "")}</textarea>
    <div style="height:16px"></div>
    <button class="btn main press" id="save">💾 Guardar${d && !e ? " y agregar a " + esc(d.title) : ""}</button>
    ${e ? `<button class="btn danger" id="delx">🗑 Borrar este ejercicio</button>` : ""}</main>`;
  $$(".pic input").forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return; const i = +inp.dataset.i;
    try{ pics[i] = await shrinkImage(f); const box = $("#pic" + i); let im = box.querySelector("img"); if(!im){ im = document.createElement("img"); box.prepend(im); } im.src = pics[i]; }
    catch(err){ toast("No se pudo leer esa imagen"); }
  });
  const lines = s => $(s).value.split("\n").map(t => t.trim()).filter(Boolean);
  $("#save").onclick = async () => {
    const name = $("#fn").value.trim();
    if(!name){ toast("Ponle nombre al ejercicio 🙂"); $("#fn").focus(); return; }
    const id = editId || "my_" + Date.now().toString(36);
    S().customEx[id] = { cat: $("#fc").value, name, equip: $("#fe").value.trim(), muscles: $("#fm").value.trim(), steps: lines("#fs"), errors: lines("#fx") };
    if(pics.some(Boolean)){ CUSTOM_IMG[id] = [pics[0] || pics[1], pics[1] || pics[0]]; await idb.put(id, CUSTOM_IMG[id]).catch(() => toast("No se pudieron guardar las fotos")); }
    if(d && !editId) d.list.push({ id, sets: 3, reps: "10–12", rest: 90 });
    save(); toast("Ejercicio guardado ✓"); go(back);
  };
  const dx = $("#delx");
  if(dx) dx.onclick = async () => {
    if(!confirm(`¿Borrar "${e.name}" de todas tus rutinas?`)) return;
    delete S().customEx[editId];
    S().routines.forEach(rr => rr.days.forEach(dd => { dd.list = dd.list.filter(x => x.id !== editId); }));
    delete CUSTOM_IMG[editId]; await idb.del(editId).catch(() => {});
    save(); go(back);
  };
}

/* =================================================================== */
/*                          MODO ENTRENAMIENTO                         */
/* =================================================================== */
let wakeLock = null;
async function keepAwake(on){
  try{
    if(on && "wakeLock" in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request("screen");
    if(!on && wakeLock){ wakeLock.release(); wakeLock = null; }
  }catch(e){}
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && document.body.classList.contains("working")){ wakeLock = null; keepAwake(true); } });
function nextPending(r, di){
  const d = r.days[di];
  for(let ei = 0; ei < d.list.length; ei++){ const dn = getDone(r.id, di, d.list[ei].id); for(let s = 0; s < d.list[ei].sets; s++) if(!dn[s]) return { ei, s }; }
  return null;
}
function viewEntrenar(rid, di, eiArg){
  const r = routine(rid), d = r && r.days[di];
  if(!d || !d.list.length) return go(`#/r/${rid}/${di}`);
  setTab(null); document.body.classList.add("working"); keepAwake(true);
  const sk = `start|${weekId()}|${rid}|${di}`;
  if(!S().done[sk]){ S().done[sk] = Date.now(); save(); }
  const np = nextPending(r, di);
  if(eiArg === undefined && !np) return viewFin(rid, di);
  const ei = Math.min(d.list.length - 1, eiArg !== undefined ? eiArg : np.ei);
  const x = d.list[ei], e = X(x.id), dn = getDone(rid, di, x.id);
  let s = 0; while(s < x.sets && dn[s]) s++;
  const exDone = s >= x.sets, pr = dayProg(r, di);
  const lw = lastW(x.id), sg = suggestion(x.id, r);
  const wVal = lw[Math.min(s, x.sets - 1)] || lw.filter(Boolean).slice(-1)[0] || (sg && sg.kg ? sg.kg : "");
  view.innerHTML = `<div class="wtop t-${d.type}"><div class="row">
      <button class="x press" id="wquit" aria-label="Salir">✕</button><div class="pbar"><i style="width:${pr.pct * 100}%"></i></div><div class="wcount">${ei + 1}/${d.list.length}</div></div></div>
    <main class="t-${d.type}">
    ${animBox(x.id)}
    <div class="xname" style="margin-bottom:4px">${esc(e.name)}</div>
    <div class="muted" style="font-size:14px;font-weight:600;margin:0 2px 8px">🏋️ ${esc(equipText(e))}</div>
    <div class="setno"><div class="big">${exDone ? "✓ Listo" : `Serie ${s + 1}<small> / ${x.sets}</small>`}</div><div class="reps"><b>${esc(x.reps)}</b><span>repeticiones</span></div></div>
    <div class="setpills">${Array.from({ length: x.sets }, (_, i) => `<i class="${dn[i] === "skip" ? "sk" : dn[i] ? "on" : i === s ? "cur" : ""}"></i>`).join("")}</div>
    ${exDone ? `<button class="btn main done-btn press" id="goNext">${nextPending(r, di) ? "Siguiente ejercicio ›" : "Terminar 🏆"}</button>` : `
      <div class="kg"><button class="press" data-d="-2.5">−</button>
        <div class="v"><input id="kg" inputmode="decimal" placeholder="0" value="${esc(wVal)}"><span>kg${!lw.length && sg && sg.kg ? " · sugerido" : best(x.id) ? " · récord " + best(x.id) : ""}</span></div>
        <button class="press" data-d="2.5">+</button></div>
      <button class="btn main done-btn press" id="doneBtn">✓ TERMINÉ LA SERIE</button>
      ${s > 0 ? `<button class="btn ghost press" id="endEx">🏁 Ya no más: terminar este ejercicio</button>` : ""}`}
    <details class="how"><summary>📖 ¿Cómo se hace?</summary>
      ${e.steps && e.steps.length ? `<ol class="stp">${e.steps.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : `<div class="muted">Sin instrucciones.</div>`}
      ${e.errors && e.errors.length ? `<div class="sec-t" style="margin-top:6px">Evita</div><ul class="errs">${e.errors.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </details>
    <div class="nav2">
      <a class="btn ghost press" href="#/w/${rid}/${di}/${Math.max(0, ei - 1)}" ${ei === 0 ? 'style="visibility:hidden"' : ""}>‹ Anterior</a>
      <a class="btn ghost press" href="#/w/${rid}/${di}/${ei + 1}" ${ei + 1 >= d.list.length ? 'style="visibility:hidden"' : ""}>Saltar ›</a></div></main>`;
  window.scrollTo(0, 0);
  $("#wquit").onclick = () => { stopRest(); go(`#/r/${rid}/${di}`); };
  $$(".kg button").forEach(b => b.onclick = () => { const i = $("#kg"); i.value = String(+Math.max(0, (parseFloat(i.value) || 0) + parseFloat(b.dataset.d)).toFixed(2)); });
  const db = $("#doneBtn");
  if(db) db.onclick = () => {
    const w = $("#kg").value.trim(); if(w) saveW(x.id, s, w);
    const a = getDone(rid, di, x.id).slice(); a[s] = true; setDone(rid, di, x.id, a);
    if(navigator.vibrate) navigator.vibrate(40);
    const left = nextPending(r, di); if(!left) return viewFin(rid, di);
    const msg = s + 1 < x.sets ? `<small>Sigue</small>Serie ${s + 2} de ${x.sets} · ${esc(x.reps)} reps` : `<small>Siguiente ejercicio</small>${esc(X(d.list[left.ei].id).name)}`;
    startRest(x.rest, msg, d.type, () => viewEntrenar(rid, di, s + 1 < x.sets ? ei : left.ei));
  };
  const ee = $("#endEx");
  if(ee) ee.onclick = () => {
    const a = getDone(rid, di, x.id).slice(); for(let i = 0; i < x.sets; i++) if(!a[i]) a[i] = "skip"; setDone(rid, di, x.id, a);
    const left = nextPending(r, di); left ? viewEntrenar(rid, di, left.ei) : viewFin(rid, di);
  };
  const gn = $("#goNext");
  if(gn) gn.onclick = () => { const left = nextPending(r, di); left ? viewEntrenar(rid, di, left.ei) : viewFin(rid, di); };
}
function viewFin(rid, di){
  const r = routine(rid), d = r.days[di];
  setTab(null); keepAwake(false); stopRest(); document.body.classList.remove("working");
  const st = S().done[`start|${weekId()}|${rid}|${di}`];
  const mins = st ? Math.max(1, Math.round((Date.now() - st) / 60000)) : dayTime(d);
  const key = `${weekId()}|${rid}|${di}`;
  if(!S().history.some(h => h.key === key)){
    S().history.unshift({ key, week: weekId(), date: new Date().toISOString(), rid, title: d.title, type: d.type, sets: totalSets(d), mins });
    S().history = S().history.slice(0, 300); save();
  }
  view.innerHTML = `<main class="t-${d.type}"><div class="finish"><div class="trophy">🏆</div><h2>¡Día completado!</h2>
    <p class="muted" style="font-weight:600">${ICON[d.type]} ${esc(d.title)}</p>
    <div class="kpis" style="margin:24px 0"><div><b>${totalSets(d)}</b><span>Series</span></div><div><b>${d.list.length}</b><span>Ejercicios</span></div><div><b>${mins}'</b><span>Minutos</span></div></div>
    <div class="note" style="text-align:left">📈 <b>Para progresar:</b> cuando completes todas las series en el máximo de repeticiones, sube el peso la siguiente vez (2.5 kg en barra, 1–2 kg en mancuerna).</div>
    <a class="btn main press" href="#/">Volver al inicio</a><a class="btn ghost press" href="#/progreso">Ver mi progreso 📈</a></div></main>`;
  confetti();
}
function confetti(){
  const c = document.createElement("div"); c.className = "confetti";
  const cols = ["#ff5a1f", "#2f9bff", "#22c55e", "#ffd23f", "#a78bfa", "#fff"];
  for(let i = 0; i < 90; i++){ const p = document.createElement("i"); p.style.left = Math.random() * 100 + "vw"; p.style.background = cols[i % cols.length]; p.style.animationDuration = 1.8 + Math.random() * 1.8 + "s"; p.style.animationDelay = Math.random() * .6 + "s"; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 4500);
}
/* descanso */
const RC = 2 * Math.PI * 52;
let rEnd = 0, rTot = 1, rInt = null, rCb = null, rBeeped = false;
function startRest(sec, nextHtml, type, cb){
  rTot = sec; rEnd = Date.now() + sec * 1000; rCb = cb; rBeeped = false;
  $("#rest").className = "show t-" + type; $("#rnext").innerHTML = nextHtml;
  clearInterval(rInt); rTick(); rInt = setInterval(rTick, 200);
}
function rTick(){
  const left = Math.max(0, (rEnd - Date.now()) / 1000);
  $("#rtxt").textContent = left > 0 ? clock(Math.ceil(left)) : "¡YA!";
  $("#rfg").setAttribute("stroke-dashoffset", RC * (1 - left / rTot));
  if(left <= 0 && !rBeeped){
    rBeeped = true; $("#rest").classList.add("end");
    if(navigator.vibrate) navigator.vibrate([300, 120, 300]); beep();
    setTimeout(() => { if(rBeeped) finishRest(); }, 1200);
  }
}
function finishRest(){ const cb = rCb; stopRest(); if(cb) cb(); }
function stopRest(){ clearInterval(rInt); rCb = null; rBeeped = false; $("#rest").className = ""; }
function beep(){
  try{ const c = new (window.AudioContext || window.webkitAudioContext)();
    [0, .25].forEach(t => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = .25; o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + .18); });
  }catch(e){}
}

/* =================================================================== */
/*                          PROGRESO Y PERFIL                          */
/* =================================================================== */
function viewProgreso(){
  setTab("progreso");
  const h = S().history, wk = h.filter(x => x.week === weekId()).length;
  const weeks = new Set(h.map(x => x.week)); let streak = 0; const dd = new Date();
  if(!weeks.has(weekId(dd))) dd.setDate(dd.getDate() - 7);
  while(weeks.has(weekId(dd))){ streak++; dd.setDate(dd.getDate() - 7); }
  const ids = Object.keys(S().best).filter(id => X(id) && S().best[id] > 0).sort((a, b) => S().best[b] - S().best[a]);
  const r = active();
  view.innerHTML = topBar("Progreso") + `<main>
    <div class="kpis"><div><b>${wk}${r ? `<small style="font-size:16px;color:var(--muted)">/${r.days.length}</small>` : ""}</b><span>Esta semana</span></div><div><b>${h.length}</b><span>Entrenos</span></div><div><b>${streak}</b><span>Semanas seguidas</span></div></div>
    <div class="label">Historial</div>
    ${h.length ? h.slice(0, 40).map(x => `<div class="card hist t-${x.type}"><div style="font-size:24px">${ICON[x.type] || "🏋️"}</div>
      <div class="grow"><b>${esc(x.title)}</b><div class="muted" style="font-size:13px">${new Date(x.date).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}</div></div>
      <div class="muted" style="font-size:13px;font-weight:700;text-align:right">${x.sets} series<br>${x.mins} min</div></div>`).join("")
      : `<div class="card empty"><span class="e">🏁</span>Aún no terminas ningún entreno.<br>Cuando completes uno, aparecerá aquí.</div>`}
    <div class="label">Tus mejores pesos</div>
    ${ids.length ? ids.slice(0, 50).map(id => `<a class="card pr press" href="#/ej/${id}"><img src="${img(id, 1)}" alt=""><div class="grow ell" style="font-weight:700">${esc(X(id).name)}</div><b>${S().best[id]} kg</b></a>`).join("")
      : `<div class="card empty"><span class="e">🏋️</span>Anota el peso al terminar cada serie y aquí verás tus récords.</div>`}</main>`;
}
function viewPerfil(){
  setTab("perfil");
  const p = S().profile, u = Auth.user || {};
  const cloudOk = CLOUD && Store.status === "nube";
  view.innerHTML = topBar("Perfil") + `<main>
    <div class="card row" style="gap:16px"><div class="avatar">${esc((p.name || "?").charAt(0).toUpperCase())}</div>
      <div class="grow"><div style="font-size:22px;font-weight:950" class="ell">${esc(p.name || "Sin nombre")}</div><div class="muted ell" style="font-size:14px">${esc(u.email || "")}</div>
      <div style="margin-top:8px"><span class="sync ${cloudOk ? "ok" : ""}"><i></i>${CLOUD ? (cloudOk ? "Guardado en la nube" : "Sin conexión: se guarda al volver") : "Modo local (solo este cel)"}</span></div></div></div>
    <div class="card plist">
      <a href="#/bienvenida"><span class="i">🧍</span>Mis datos<span class="v">${p.weight ? p.weight + " kg" : "—"}${p.age ? " · " + p.age + " años" : ""}</span></a>
      <a href="#/perfil/gym"><span class="i">🏟️</span>Mi gym (equipo)<span class="v">${(p.equipment || []).length} equipos</span></a>
      <a href="#/crear/gym"><span class="i">🤖</span>Nueva rutina con mi gym<span class="v">›</span></a>
      <a href="#/ejercicios"><span class="i">📚</span>Biblioteca de ejercicios<span class="v">${Object.keys(EX).length + Object.keys(S().customEx).length}</span></a>
      <a href="privacidad.html" target="_blank" rel="noopener"><span class="i">🔒</span>Privacidad<span class="v">›</span></a>
    </div>
    <div class="card plist">
      <div class="row" style="padding:12px 4px"><span class="i">🌱</span><span class="grow" style="font-weight:700">Nivel</span><span class="v">${p.level ? LEVELS[p.level].name : "—"}</span></div>
      <div class="row" style="padding:12px 4px;border-top:1px solid var(--line)"><span class="i">🎯</span><span class="grow" style="font-weight:700">Objetivo</span><span class="v">${p.goal ? GOALS[p.goal].name : "—"}</span></div>
    </div>
    ${apkBanner()}
    <button class="btn danger" id="out">Cerrar sesión</button>
    <div class="center muted" style="font-size:12px;margin-top:10px">MyGym · v1.0</div></main>`;
  fillApk();
  $("#out").onclick = async () => { if(!confirm("¿Cerrar sesión?")) return; clearTimeout(Store.timer); if(Auth.fb && Store.uid) await Store.push(); await Auth.logout(); Store.clear(); go("#/login"); };
}
function viewPerfilGym(){
  setTab(null);
  const set = new Set(S().profile.equipment || []);
  let q = "";
  view.innerHTML = topBar("Mi gym", "#/perfil") + `<main class="t-brand">
    <div class="wsub" style="margin-top:4px">Marca lo que hay en tu gym. Se usa para crear rutinas y para filtrar la biblioteca.</div>
    <div class="presets">${EQUIP_PRESETS.map(p => `<button class="press" data-pre="${p.id}"><span class="e">${p.icon}</span>${p.name}</button>`).join("")}</div>
    <input class="search" id="eqq" placeholder="🔍 Buscar por nombre…"><div id="eqg"></div>
    <div class="sticky-bottom"><button class="btn main press" id="sv">💾 Guardar (${set.size})</button></div></main>`;
  const upd = () => { $("#sv").textContent = `💾 Guardar (${set.size})`; };
  const draw = () => equipGrid($("#eqg"), set, upd, () => q);
  $("#eqq").oninput = e => { q = e.target.value; draw(); };
  $$("[data-pre]").forEach(b => b.onclick = () => { set.clear(); EQUIP_PRESETS.find(x => x.id === b.dataset.pre).items.forEach(i => set.add(i)); draw(); upd(); });
  draw();
  $("#sv").onclick = () => { S().profile.equipment = [...set]; save(); toast("Mi gym guardado ✓"); go("#/perfil"); };
}

/* =================================================================== */
/*                               ROUTER                                */
/* =================================================================== */
function route(){
  const [path, qs] = location.hash.replace(/^#\/?/, "").split("?");
  const p = path.split("/").filter(Boolean), q = new URLSearchParams(qs || "");
  if(p[0] !== "w"){ document.body.classList.remove("working"); keepAwake(false); stopRest(); }
  window.scrollTo(0, 0);
  if(!Auth.user){
    if(p[0] === "registro") return viewRegistro();
    if(p[0] === "recuperar") return viewRecuperar();
    return viewLogin();
  }
  if(!Store.uid) return afterLogin();
  if(!S().onboarded && p[0] !== "bienvenida") return go("#/bienvenida");
  switch(p[0]){
    case "bienvenida": return viewBienvenida();
    case "rutinas": return viewRutinas();
    case "crear":
      if(p[1] === "manual") return viewCrearManual();
      if(p[1] === "gym"){ if(!W) W = newWizard(); return viewGym(); }
      if(p[1] === "preview") return viewPreview();
      return viewRutinas();
    case "r":
      if(p.length === 2) return viewRutina(p[1]);
      if(p[3] === "editar") return viewDiaEditar(p[1], +p[2]);
      if(p[3] === "agregar") return viewAgregar(p[1], +p[2]);
      if(p[3] === "e") return viewEjDia(p[1], +p[2], +p[4]);
      return viewDia(p[1], +p[2]);
    case "w": return viewEntrenar(p[1], +p[2], p[3] !== undefined ? +p[3] : undefined);
    case "ejercicios": return viewEjercicios();
    case "ej": return viewEj(decodeURIComponent(p[1] || ""));
    case "nuevo-ej": return viewNuevoEj(q);
    case "progreso": return viewProgreso();
    case "perfil": return p[1] === "gym" ? viewPerfilGym() : viewPerfil();
    default: return viewHoy();
  }
}
window.addEventListener("hashchange", route);
$("#rfg").setAttribute("stroke-dasharray", RC);
$("#radd").onclick = () => { rEnd = Math.max(rEnd, Date.now()) + 15000; rTot = Math.max(rTot, (rEnd - Date.now()) / 1000); rBeeped = false; $("#rest").classList.remove("end"); };
$("#rskip").onclick = finishRest;

(async function start(){
  await idb.loadAll();
  let first = true;
  await Auth.init(async u => {
    if(u){
      if(Store.uid !== u.uid){ await Store.load(u); }
      if(/^#\/(login|registro|recuperar)?$/.test(location.hash) || !location.hash) go(S().onboarded ? "#/" : "#/bienvenida");
    } else { Store.clear(); }
    if(first || true){ first = false; route(); }
  });
})();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
