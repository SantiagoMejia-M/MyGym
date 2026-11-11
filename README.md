# MyGym 💪

App para crear y seguir tu rutina de gym, hecha con **las máquinas que tiene tu gym**.
Es una app web instalable (PWA): funciona en el celular, se instala en la pantalla de inicio y se puede subir a Google Play.

## Qué hace
- **Cuenta:** registro e inicio de sesión con correo o Google. Los datos se guardan en la nube (Firebase).
- **Crear rutina con MI gym:** marcas tu equipo en un catálogo con fotos (o con botones rápidos: gym completo, básico, en casa), eliges nivel, objetivo, días y tiempo, y se arma la rutina con series, reps, descansos y peso sugerido.
- **Crear rutina por mi cuenta:** eliges los días y los ejercicios de una biblioteca de 136, cada uno con animación, pasos y errores comunes.
- **Ejercicios propios** con tus fotos (las fotos se guardan solo en el celular).
- **Modo entrenamiento:** serie por serie, registro de peso, descanso con cuenta regresiva, pantalla siempre encendida y botón para terminar un ejercicio antes.
- **Progreso:** historial, récords y semanas seguidas.

## Publicarla (GitHub Pages)
Settings → Pages → *Deploy from a branch* → elige la rama → carpeta `/ (root)`.
Queda en `https://santiagomejia-m.github.io/MyGym/`.

## Conectar Firebase (cuentas y nube)
Sin esto, la app funciona en **modo local**: las cuentas se guardan solo en ese celular.

1. Entra a **console.firebase.google.com** → *Agregar proyecto* (puedes desactivar Google Analytics).
2. **Authentication** → *Comenzar* → en *Método de acceso* activa **Correo electrónico/contraseña** y **Google**.
3. En **Authentication → Configuración → Dominios autorizados** agrega `santiagomejia-m.github.io`.
4. **Firestore Database** → *Crear base de datos* → modo producción → elige una ubicación cercana.
5. En **Firestore → Reglas**, pega el contenido de [`firestore.rules`](firestore.rules) y publica.
6. **Configuración del proyecto** (⚙️) → *Tus apps* → ícono web `</>` → registra la app → copia el objeto `firebaseConfig`.
7. Pega esos valores en [`js/firebase-config.js`](js/firebase-config.js) y sube el cambio.

Los datos de `firebaseConfig` son públicos por diseño; lo que protege la información de cada usuario son las reglas de Firestore.
El plan gratis (Spark) alcanza de sobra para empezar.

## Estructura
| Archivo | Qué es |
|---|---|
| `index.html` | Página principal |
| `css/styles.css` | Diseño |
| `js/app.js` | Pantallas y navegación |
| `js/engine.js` | Generador de rutinas, series/reps y pesos sugeridos |
| `js/data.js` | Cuentas (Firebase o local) y guardado |
| `data/exercises.js` | Biblioteca de ejercicios en español |
| `data/equipment.js` | Catálogo visual de equipo |
| `sw.js` | Modo sin internet |
| `tools/` | Scripts para validar la biblioteca y probar el generador |

## Imágenes
Las fotos de ejercicios vienen de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (publicado como dominio público).
No se conoce al autor original de las fotos: **antes de publicar en tiendas conviene reemplazarlas** por imágenes propias o con licencia comercial.
