// Catálogo visual de equipo. img = foto de ejemplo (carpeta en img/ y cuadro 0 o 1).
// aka = otros nombres con los que la gente lo conoce (para el buscador).
const EQUIP_GROUPS = [
  { id: "bancos", name: "Bancos", icon: "🛋️", items: [
    { id: "banco_plano", name: "Banco plano", desc: "Banco recto, para acostarte.", img: "Dumbbell_Bench_Press/0", aka: "banca recta horizontal" },
    { id: "banco_incl", name: "Banco inclinable", desc: "El respaldo se levanta (inclinado o vertical).", img: "Incline_Dumbbell_Press/0", aka: "banca inclinada ajustable regulable" },
    { id: "banco_decl", name: "Banco declinado", desc: "La cabeza queda más abajo que los pies.", img: "Decline_Dumbbell_Bench_Press/0", aka: "banca declinada" },
    { id: "banco_pred", name: "Banco predicador", desc: "Cojín inclinado para apoyar los brazos (bíceps).", img: "Preacher_Curl/0", aka: "scott banca curl" }
  ]},
  { id: "libres", name: "Pesos libres", icon: "🏋️", items: [
    { id: "mancuernas", name: "Mancuernas", desc: "Pesas de una mano.", img: "Hammer_Curls/0", aka: "pesas dumbbells" },
    { id: "barra", name: "Barra olímpica + discos", desc: "Barra larga a la que se le ponen discos.", img: "Bent_Over_Barbell_Row/0", aka: "barra larga recta olimpica" },
    { id: "barra_z", name: "Barra Z", desc: "Barra corta y ondulada.", img: "EZ-Bar_Curl/0", aka: "barra ez curva w" },
    { id: "discos", name: "Discos sueltos", desc: "Discos para cargar o usar en la mano.", img: "Front_Plate_Raise/0", aka: "platos pesas" },
    { id: "rueda", name: "Rueda abdominal", desc: "Rueda con dos mangos.", img: "Ab_Roller/0", aka: "rodillo abdominal" }
  ]},
  { id: "estructuras", name: "Jaulas y barras", icon: "🏗️", items: [
    { id: "rack", name: "Jaula / rack", desc: "Estructura con ganchos para dejar la barra (sentadilla, press).", img: "Barbell_Squat/0", aka: "rack sentadilla power cage jaula" },
    { id: "smith", name: "Multipower (Smith)", desc: "Barra guiada por rieles.", img: "Smith_Machine_Squat/0", aka: "smith maquina guiada multipower" },
    { id: "dominadas", name: "Barra de dominadas", desc: "Barra alta para colgarte.", img: "Pullups/1", aka: "pull up barra fija" },
    { id: "paralelas", name: "Paralelas (fondos)", desc: "Dos barras paralelas para fondos.", img: "Dips_-_Triceps_Version/0", aka: "fondos dips" },
    { id: "hiper", name: "Banco de lumbares", desc: "Banco para hiperextensiones.", img: "Hyperextensions_Back_Extensions/0", aka: "hiperextensiones lumbar romano" }
  ]},
  { id: "poleas", name: "Poleas y agarres", icon: "🔗", items: [
    { id: "polea", name: "Polea ajustable / cruce de poleas", desc: "Torre con cable que sube y baja.", img: "Cable_Crossover/0", aka: "crossover cable poleas jaula" },
    { id: "jalon", name: "Máquina de jalón", desc: "Asiento con barra larga arriba.", img: "Wide-Grip_Lat_Pulldown/0", aka: "jalon al pecho lat pulldown polea alta" },
    { id: "remo_polea", name: "Remo sentado en polea", desc: "Asiento bajo con cable al frente.", img: "Seated_Cable_Rows/0", aka: "remo bajo polea baja gironda" },
    { id: "cuerda", name: "Agarre de cuerda", desc: "Cuerda con dos puntas.", img: "Triceps_Pushdown_-_Rope_Attachment/1", aka: "soga rope" },
    { id: "agarre_v", name: "Agarre en V / triángulo", desc: "Agarre cerrado con las palmas mirándose.", img: "Triceps_Pushdown_-_V-Bar_Attachment/0", aka: "triangulo v bar" }
  ]},
  { id: "superior", name: "Máquinas tren superior", icon: "💪", items: [
    { id: "m_pecho", name: "Press de pecho en máquina", desc: "Sentado, empujas al frente.", img: "Leverage_Chest_Press/0", aka: "chest press pecho maquina" },
    { id: "m_pecdeck", name: "Pec deck / aperturas", desc: "Sentado, juntas los brazos al frente.", img: "Butterfly/0", aka: "peck deck mariposa contractor aperturas" },
    { id: "m_hombro", name: "Press de hombro en máquina", desc: "Sentado, empujas hacia arriba.", img: "Machine_Shoulder_Military_Press/0", aka: "shoulder press hombro maquina" },
    { id: "m_remo", name: "Remo en máquina", desc: "Pecho apoyado, jalas hacia ti.", img: "Leverage_Iso_Row/0", aka: "row remo maquina" },
    { id: "m_tbar", name: "Remo en T con pecho apoyado", desc: "Te acuestas boca abajo y jalas.", img: "Lying_T-Bar_Row/0", aka: "t bar remo t" },
    { id: "m_biceps", name: "Máquina de bíceps", desc: "Brazos apoyados en un cojín.", img: "Machine_Preacher_Curls/0", aka: "curl biceps maquina" },
    { id: "m_triceps", name: "Máquina de tríceps / fondos", desc: "Sentado, empujas hacia abajo.", img: "Dip_Machine/0", aka: "fondos maquina triceps" },
    { id: "m_abdomen", name: "Máquina de abdomen", desc: "Sentado, enrollas el torso.", img: "Ab_Crunch_Machine/0", aka: "abdominales crunch maquina" }
  ]},
  { id: "pierna", name: "Máquinas de pierna", icon: "🦵", items: [
    { id: "prensa", name: "Prensa", desc: "Empujas una plataforma con los pies.", img: "Leg_Press/0", aka: "leg press prensa inclinada" },
    { id: "hack", name: "Sentadilla hack", desc: "Sentadilla con la espalda apoyada.", img: "Hack_Squat/0", aka: "hack squat pendulo" },
    { id: "extension", name: "Extensión de cuádriceps", desc: "Sentado, estiras las piernas.", img: "Leg_Extensions/1", aka: "extensiones cuadriceps leg extension" },
    { id: "curl_acostado", name: "Curl femoral acostado", desc: "Boca abajo, doblas las piernas.", img: "Lying_Leg_Curls/1", aka: "femoral acostado isquios leg curl" },
    { id: "curl_sentado", name: "Curl femoral sentado", desc: "Sentado, doblas las piernas hacia abajo.", img: "Seated_Leg_Curl/0", aka: "femoral sentado isquios" },
    { id: "abductor", name: "Abductor", desc: "Sentado, abres las piernas.", img: "Thigh_Abductor/0", aka: "abductores gluteo medio" },
    { id: "aductor", name: "Aductor", desc: "Sentado, cierras las piernas.", img: "Thigh_Adductor/0", aka: "aductores pierna interna" },
    { id: "pant_pie", name: "Pantorrilla de pie", desc: "Hombros bajo almohadillas, subes en puntas.", img: "Standing_Calf_Raises/0", aka: "gemelos chamorro calf" },
    { id: "pant_sentado", name: "Pantorrilla sentado", desc: "Sentado, subes en puntas.", img: "Seated_Calf_Raise/0", aka: "soleo gemelos sentado" }
  ]}
];
const EQUIP = {};
EQUIP_GROUPS.forEach(g => g.items.forEach(i => { EQUIP[i.id] = { ...i, group: g.id }; }));

// Botones rápidos
const EQUIP_PRESETS = [
  { id: "completo", name: "Gym completo", icon: "🏟️", desc: "Tengo de todo", items: Object.keys(EQUIP) },
  { id: "basico", name: "Gym básico", icon: "🏋️", desc: "Pesos libres, bancos, poleas y prensa",
    items: ["banco_plano","banco_incl","mancuernas","barra","discos","rack","dominadas","polea","jalon","remo_polea","cuerda","prensa","extension","curl_acostado"] },
  { id: "casa", name: "En casa", icon: "🏠", desc: "Mancuernas y un banco", items: ["banco_plano","banco_incl","mancuernas"] }
];
