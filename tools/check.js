// Valida la biblioteca y descarga las imágenes que falten: node tools/check.js [ruta exercises.json]
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
eval(fs.readFileSync(root + "/data/exercises.js", "utf8") + fs.readFileSync(root + "/data/equipment.js", "utf8") + "\nglobalThis.EX_RAW=EX_RAW;globalThis.EQUIP=EQUIP;");
const db = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const ids = new Set(db.map(e => e.id));
const need = new Set(), bad = [];
for (const e of EX_RAW) { if (!ids.has(e[0])) bad.push(e[0]); need.add(e[0]); for (const r of e[5]) if (!EQUIP[r]) bad.push("equipo " + r + " en " + e[0]); }
for (const k in EQUIP) { const f = EQUIP[k].img.split("/")[0]; if (!ids.has(f)) bad.push("img " + f); need.add(f); }
const dup = EX_RAW.map(e => e[0]).filter((x, i, a) => a.indexOf(x) !== i);
const pats = {}; EX_RAW.forEach(e => { pats[e[3]] = (pats[e[3]] || 0) + 1; });
console.log("ejercicios", EX_RAW.length, "imagenes", need.size, "errores", bad, "duplicados", dup);
console.log(pats);
fs.writeFileSync(path.join(root, "tools", "need.txt"), [...need].join("\n") + "\n");
