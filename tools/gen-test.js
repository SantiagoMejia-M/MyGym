// Prueba el generador en consola: node tools/gen-test.js
const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
eval(["data/exercises.js","data/equipment.js","js/engine.js"].map(f => fs.readFileSync(path.join(r, f), "utf8")).join("\n") + `
const cases = [
  ["completo", Object.keys(EQUIP), "intermedio", "musculo", 6, 75],
  ["basico", EQUIP_PRESETS[1].items, "principiante", "musculo", 3, 60],
  ["casa", EQUIP_PRESETS[2].items, "principiante", "definir", 4, 45],
  ["santiago", ["banco_plano","banco_incl","mancuernas","polea","jalon","remo_polea","cuerda","agarre_v","prensa","extension","curl_acostado"], "avanzado", "fuerza", 5, 90]
];
for(const [n, eq, lv, g, d, t] of cases){
  const R = generateRoutine({ equipment: eq, level: lv, goal: g, daysPerWeek: d, duration: t });
  console.log("\\n=== " + n + " " + lv + " " + g + " " + d + "d " + t + "min · " + R.meta.split);
  R.days.forEach(day => console.log(" " + day.wd + " " + day.title + " (" + dayTime(day) + "min): " + day.list.map(x => EX[x.id].name + " " + x.sets + "x" + x.reps).join(" | ")));
  const w = suggestWeight(R.days[0].list[0].id, { weight: 75, sex: "hombre", level: lv, goal: g });
  console.log(" peso sugerido 1er ejercicio:", w && w.label);
}`);
