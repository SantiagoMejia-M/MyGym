// Cuentas y guardado de MyGym.
// Con Firebase configurado: login real (correo o Google) y los datos se sincronizan en Firestore (users/{uid}).
// Sin configurar: "modo local", las cuentas viven solo en este navegador.
"use strict";

const FB_VER = "10.12.2";
const CLOUD = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

const newState = () => ({
  v: 1, updatedAt: 0, onboarded: false,
  profile: { name: "", sex: "", weight: 0, height: 0, age: 0, level: "", goal: "", equipment: [] },
  routines: [], activeId: null, done: {}, history: [], weights: {}, best: {}, customEx: {}
});

const Auth = {
  user: null, fb: null,
  async init(onChange){
    if(CLOUD){
      try{
        const [app, auth, fs] = await Promise.all([
          import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth.js`),
          import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`)
        ]);
        const a = app.initializeApp(window.FIREBASE_CONFIG);
        this.fb = { auth, fs, A: auth.getAuth(a), D: fs.getFirestore(a) };
        auth.onAuthStateChanged(this.fb.A, u => { this.user = u ? { uid: u.uid, email: u.email, name: u.displayName || "" } : null; onChange(this.user); });
        return;
      }catch(e){ console.warn("Firebase no disponible, uso modo local", e); }
    }
    const s = ls.get("mg:session", null);
    this.user = s; onChange(s);
  },
  async register(name, email, pass){
    email = email.trim().toLowerCase();
    if(this.fb){
      const { auth, A } = this.fb;
      const c = await auth.createUserWithEmailAndPassword(A, email, pass);
      await auth.updateProfile(c.user, { displayName: name });
      this.user = { uid: c.user.uid, email, name };
      return this.user;
    }
    const acc = ls.get("mg:accounts", {});
    if(acc[email]) throw new Error("auth/email-already-in-use");
    const uid = "local_" + Date.now().toString(36);
    acc[email] = { uid, name, hash: await sha(email + ":" + pass) };
    ls.set("mg:accounts", acc);
    this.user = { uid, email, name }; ls.set("mg:session", this.user);
    return this.user;
  },
  async login(email, pass){
    email = email.trim().toLowerCase();
    if(this.fb){ const c = await this.fb.auth.signInWithEmailAndPassword(this.fb.A, email, pass); return c.user; }
    const a = ls.get("mg:accounts", {})[email];
    if(!a || a.hash !== await sha(email + ":" + pass)) throw new Error("auth/invalid-credential");
    this.user = { uid: a.uid, email, name: a.name }; ls.set("mg:session", this.user);
    return this.user;
  },
  async google(){
    if(!this.fb) throw new Error("auth/local-mode");
    const { auth, A } = this.fb;
    return auth.signInWithPopup(A, new auth.GoogleAuthProvider());
  },
  async reset(email){
    if(!this.fb) throw new Error("auth/local-mode");
    return this.fb.auth.sendPasswordResetEmail(this.fb.A, email.trim());
  },
  async logout(){
    if(this.fb) await this.fb.auth.signOut(this.fb.A);
    ls.del("mg:session"); this.user = null;
  }
};
async function sha(t){
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function authError(e){
  const c = String((e && (e.code || e.message)) || "");
  if(/email-already-in-use/.test(c)) return "Ese correo ya tiene cuenta. Inicia sesión.";
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "Correo o contraseña incorrectos.";
  if(/invalid-email/.test(c)) return "Ese correo no es válido.";
  if(/weak-password/.test(c)) return "La contraseña debe tener al menos 6 caracteres.";
  if(/too-many-requests/.test(c)) return "Demasiados intentos. Espera un momento.";
  if(/popup-closed|cancelled-popup/.test(c)) return "Cerraste la ventana de Google.";
  if(/network/.test(c)) return "Sin conexión a internet.";
  if(/local-mode/.test(c)) return "Esto funciona cuando la app esté conectada a Firebase.";
  return "Algo salió mal. Intenta de nuevo.";
}

/* ---------- estado del usuario ---------- */
const Store = {
  s: newState(), uid: null, timer: null, status: "local",
  key(){ return "mg:state:" + this.uid; },
  async load(user){
    this.uid = user.uid;
    let local = ls.get(this.key(), null);
    if(this.uid && Auth.fb){
      try{
        const { fs, D } = Auth.fb;
        const snap = await fs.getDoc(fs.doc(D, "users", this.uid));
        const cloud = snap.exists() ? snap.data().state : null;
        if(cloud && (!local || (cloud.updatedAt || 0) >= (local.updatedAt || 0))) local = cloud;
        this.status = "nube";
      }catch(e){ console.warn("No se pudo leer la nube", e); this.status = "sin conexión"; }
    }
    this.s = Object.assign(newState(), local || {});
    this.s.profile = Object.assign(newState().profile, this.s.profile || {});
    if(!this.s.profile.name && user.name) this.s.profile.name = user.name;
    pruneDone(this.s);
    return this.s;
  },
  save(){
    this.s.updatedAt = Date.now();
    if(!ls.set(this.key(), this.s)) console.warn("Sin espacio local");
    if(Auth.fb && this.uid){
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.push(), 1200);
    }
  },
  async push(){
    try{
      const { fs, D } = Auth.fb;
      await fs.setDoc(fs.doc(D, "users", this.uid), { state: JSON.parse(JSON.stringify(this.s)), email: Auth.user && Auth.user.email || "" });
      this.status = "nube";
    }catch(e){ this.status = "sin conexión"; console.warn("No se pudo guardar en la nube", e); }
  },
  clear(){ clearTimeout(this.timer); this.s = newState(); this.uid = null; }
};
// borra marcas de series de semanas viejas (más de 4 semanas)
function pruneDone(s){
  const keep = new Set([0, 1, 2, 3].map(i => { const d = new Date(); d.setDate(d.getDate() - 7 * i); return weekId(d); }));
  Object.keys(s.done || {}).forEach(k => { if(!keep.has(k.split("|")[0])) delete s.done[k]; });
}
function weekId(date = new Date()){
  const d = new Date(date); d.setHours(12); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}

/* ---------- fotos de ejercicios propios (solo en este cel) ---------- */
const CUSTOM_IMG = {};
const idb = {
  db: null,
  open(){ return this.db ? Promise.resolve(this.db) : new Promise((ok, ko) => {
    const r = indexedDB.open("mygym", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("imgs");
    r.onsuccess = () => ok(this.db = r.result); r.onerror = () => ko(r.error);
  }); },
  tx(mode, fn){ return this.open().then(db => new Promise((ok, ko) => {
    const t = db.transaction("imgs", mode); const req = fn(t.objectStore("imgs"));
    t.oncomplete = () => ok(req && req.result); t.onerror = () => ko(t.error);
  })); },
  put(k, v){ return this.tx("readwrite", s => s.put(v, k)); },
  del(k){ return this.tx("readwrite", s => s.delete(k)); },
  loadAll(){ return this.open().then(db => new Promise(ok => {
    const c = db.transaction("imgs").objectStore("imgs").openCursor();
    c.onsuccess = () => { const cur = c.result; if(cur){ CUSTOM_IMG[cur.key] = cur.value; cur.continue(); } else ok(); };
    c.onerror = () => ok();
  })).catch(() => {}); }
};
function shrinkImage(file){
  return new Promise((ok, ko) => {
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => {
      const k = Math.min(1, 640 / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", .78));
    }; im.onerror = ko; im.src = fr.result; };
    fr.onerror = ko; fr.readAsDataURL(file);
  });
}
