// ──────────────────────────────────────────────
//  VALIDACIÓN DE SESIÓN
// ──────────────────────────────────────────────
const SESSION_KEY = 'ok_session_v3';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const SIGN_KEY    = 'OK::sign::v3::OK::2026::orbital-kronnos::v3::pepper';
const enc         = new TextEncoder();

async function hmacHex(msg) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(SIGN_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function constEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function validateSession() {
  const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const { p, s } = JSON.parse(raw);
    const expect = await hmacHex(p);
    if (!constEq(expect, s)) { clearSessionData(); return null; }
    const data = JSON.parse(p);
    if (!data.u || Date.now() - data.ts > SESSION_TTL) { clearSessionData(); return null; }
    return data;
  } catch { clearSessionData(); return null; }
}

function clearSessionData() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

async function checkSessionAndLoad() {
  const session = await validateSession();
  if (!session) { window.location.replace('../login/'); return; }
  showApiKeyModal();
}

window.addEventListener('load', checkSessionAndLoad);

// ──────────────────────────────────────────────
//  URL DEL SERVIDOR EN RAILWAY
//  ↓↓ CAMBIA ESTO por tu URL real de Railway ↓↓
// ──────────────────────────────────────────────
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/chat'
  : 'https://orbital-kronnos-production.up.railway.app/api/chat'; // ← pega tu URL pública

// ──────────────────────────────────────────────
//  MANUAL DECODE (extraído del PDF oficial)
// ──────────────────────────────────────────────
const DECODE_MANUAL = `=== MANUAL FTC DECODE 2025-2026 (Resumen del Manual Oficial) ===

--- RESUMEN DEL JUEGO ---
En DECODE™ presentado por RTX: dos ALIANZAS de 2 equipos anotan ARTEFACTOS morados y verdes en su OBJETIVO, construyen PATRONES y regresan a su BASE.
Justo antes del partido, el OBELISCO se aleatoriza mostrando uno de 3 MOTIVOS (GPP, PGP, PPG).
AUTO (30s): Robots autónomos. Pueden leer el OBELISCO con sensores (AprilTags) para decodificar el MOTIVO. Ganan puntos por SALIR de la LÍNEA DE LANZAMIENTO, anotar ARTEFACTOS y construir PATRÓN.
TELEOP (2 min): Drivers controlan el robot. Continúan anotando ARTEFACTOS. Drive Team puede cargar ARTEFACTOS desde la ZONA DE CARGA. Al final, regresar a BASE para bonus.
La ALIANZA con más puntos gana. RANKING POINTS adicionales por superar umbrales.

--- ELEMENTOS DEL CAMPO ---
- FIELD: 144x144 pulgadas (365.75 cm x 365.75 cm), 36 TILES de espuma interconectadas.
- CLASSIFIER (por alianza): SQUARE + RAMP + GATE. El GATE impide que ARTEFACTOS CLASIFICADOS salgan de la RAMP hacia el túnel contrario.
- GOAL (por alianza): donde se anotan los ARTEFACTOS.
- OBELISK: central, aleatoriza el MOTIVO. Tiene AprilTags ID 21 (GPP), 22 (PGP), 23 (PPG).
- ARTEFACTOS: bolas de ~4.9 in. de diámetro. 24 morados (P) y 12 verdes (G) por partido.
- BASE ZONE: área donde los robots regresan al final del TELEOP.
- ZONA DE CARGA: donde el Drive Team carga ARTEFACTOS al robot.
- LÍNEA DE LANZAMIENTO: línea que el robot debe cruzar en AUTO para ganar puntos de LEAVE.
- DEPÓSITO: zona adyacente al GOAL, ARTEFACTOS aquí valen puntos al final.

--- MOTIVOS DEL OBELISCO ---
- GPP (AprilTag ID 21): RAMP índices 1=G, 2=P, 3=P, 4=G, 5=P, 6=P, 7=G, 8=P, 9=P
- PGP (AprilTag ID 22): RAMP índices 1=P, 2=G, 3=P, 4=P, 5=G, 6=P, 7=P, 8=G, 9=P
- PPG (AprilTag ID 23): RAMP índices 1=P, 2=P, 3=G, 4=P, 5=P, 6=G, 7=P, 8=P, 9=G
Los ARTEFACTOS en RAMP puntúan PATRÓN si su color coincide con el índice del MOTIVO y están retenidos por la GATE.

--- VALORES DE PUNTOS (Tabla oficial) ---
LEAVE (AUTO): 3 pts
ARTEFACTO CLASIFICADO (AUTO): 3 pts
ARTEFACTO CLASIFICADO (TELEOP): 3 pts
ARTEFACTO OVERFLOW (AUTO o TELEOP): 1 pt
ARTEFACTO DEPOT (TELEOP, al final): 1 pt
PATRÓN - ARTEFACTO coincide con MOTIVO (AUTO o TELEOP): 2 pts por ARTEFACTO
BASE PARCIAL (TELEOP): 5 pts
BASE COMPLETO (TELEOP): 10 pts
BONUS: 2 ROBOTS completamente en BASE: +10 pts adicionales

RANKING POINTS (RP) por evento normal:
- MOVEMENT RP: LEAVE + BASE ≥ 16 pts → 1 RP
- GOAL RP: ARTEFACTOS a través del CUADRADO ≥ 36 → 1 RP
- PATTERN RP: puntos PATRÓN ≥ 18 → 1 RP
- WIN: 3 RP | TIE: 1 RP

--- CRITERIOS DE PUNTUACIÓN DETALLADOS ---
CLASIFICADO: ARTEFACTO entra al GOAL por la parte superior → sale por el arco → pasa por el CUADRADO → va directamente a la RAMP.
OVERFLOW: pasa el CUADRADO pero rueda sobre otros ARTEFACTOS en la RAMP.
Si no cumple todos los criterios, NO puntúa.

--- PERIODOS DEL MATCH ---
AUTO: 30 segundos. Sin control de drivers.
Transición: 8 segundos entre AUTO y TELEOP (evaluación de puntos de AUTO).
TELEOP: 2 minutos. Drivers controlan remotamente.

--- REGLAS DE CONSTRUCCIÓN DEL ROBOT ---
R101: Configuración de inicio: cubo de 18x18x18 pulgadas (45.70 cm).
R103: Sin límite de peso.
R104: No diseñar para desprender componentes intencionalmente.
R105: Expansión horizontal máx.: 18x18 in. Vertical normal: 18 in. Vertical extendido (G415): 38 in.
R501 - Motores permitidos (máx. 8): AndyMark NeveRest, goBILDA Yellow Jacket (5201-5204 series), goBILDA 5000, REV HD Hex, REV Core Hex, TETRIX TorqueNADO, Studica Maverick, SWYFT Spike, NFR Yuksel.
R502 - Servos (máx. 10): ≤8W y ≤4A a 6V. REV Control/Expansion Hub dan 5V; REV Servo Power Module, goBILDA Servo Power Injector, Studica Servo Power Block y REV Servo Hub dan 6V.
R503: Límite total: máximo 8 motores + 10 servos en todas las configuraciones del robot.

--- ELECTRÓNICA Y CONTROL ---
Control Hub REV-31-1595: hub principal del robot.
Expansion Hub REV-31-1153: hub adicional opcional.
REV Servo Hub REV-11-1855: 2 servos por puerto.
Sistema de control: Android + FTC SDK en Java.
Driver Hub: tablet para controlar el robot en TELEOP.
Programación: Java con el SDK de FTC. OpModes: LinearOpMode o iterativo (OpMode).

--- AVANCE Y CLASIFICACIÓN ---
Clasificación: por Ranking Points (RP), desempate por puntaje promedio sin fouls.
Avance: Qualifying Tournaments → (Super Qualifying) → Regional Championship → FIRST Championship.
Advancement Points: rendimiento clasificatorio (2-16 pts) + selección de alianza + playoffs + premios evaluados.`;

// ──────────────────────────────────────────────
//  SYSTEM PROMPTS POR MODO
// ──────────────────────────────────────────────
function buildSystem(mode) {
  const base = `Eres RoboRobin, asistente experto en robótica del programa STEAM Maker de FUSALMO en El Salvador, para jóvenes de 12-17 años. Responde siempre en español claro y amigable. NO des código Java ni código de programación bajo ninguna circunstancia - si te lo piden, explica amablemente que no puedes ayudar con eso. Puedes responder sobre todo lo demás: mecánica, estrategia, reglas, hardware, sensores, conceptos, preguntas generales, etc.

Tienes acceso al Manual Oficial de Competición FTC DECODE 2025-2026. Cuando te hagan preguntas sobre el juego, reglas, puntuación, campo o construcción del robot, consulta esta información:

${DECODE_MANUAL}`;

  const extras = {
    ftc:      `\n\nModo actual: FTC DECODE 2025-2026. Ayuda con reglas del juego, estrategia, hardware, sensores y mecanismos para el desafío DECODE.`,
    fgc:      `\n\nModo actual: FGC 2026 "Igniting Innovation" - representando a El Salvador. El desafío trata sobre prevención de incendios forestales. Ayuda con estrategia, hardware y mecánica para ese desafío.`,
    debug:    `\n\nModo actual: Diagnóstico. Ayuda a resolver problemas técnicos de hardware, mecánica y funcionamiento del robot. Pide siempre el mayor detalle posible del problema.`,
    strategy: `\n\nModo actual: Estrategia. Ayuda a planificar puntuaciones, selección de alianzas, orden de tareas en AUTO y TELEOP, y cómo maximizar puntos y RANKING POINTS.`
  };
  return base + (extras[mode] || '');
}

const QUICK = {
  ftc:      ["¿Cómo funciona el OBELISCO?", "¿Cuántos puntos vale el PATRÓN?", "¿Cuántos motores puede tener mi robot?", "¿Cuál es el tamaño máximo del robot?"],
  fgc:      ["¿Cómo empiezo con el robot FGC?", "¿Qué sensores puedo usar?", "¿Cómo funciona el mecanismo de recolección?", "¿Qué hace el HUMAN PLAYER?"],
  debug:    ["Mi robot no se mueve", "El motor no responde", "Problema con el Control Hub", "Robot va al revés"],
  strategy: ["¿Qué priorizar en AUTO?", "¿Cómo lograr el MOVEMENT RP?", "¿Cómo maximizar PATTERN RP?", "Estrategia para alianzas FGC"]
};

// ──────────────────────────────────────────────
//  ESTADO DE LA APP
// ──────────────────────────────────────────────
let currentMode = 'ftc';
let conversationHistory = [];
let isLoading = false;
let userApiKey = '';

// ──────────────────────────────────────────────
//  MODAL DE API KEY
// ──────────────────────────────────────────────
function showApiKeyModal() {
  document.getElementById('apiModal').style.display = 'flex';
  setTimeout(() => document.getElementById('apiKeyInput').focus(), 100);
}

function hideApiKeyModal() {
  document.getElementById('apiModal').style.display = 'none';
}

function confirmApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key || !key.startsWith('sk-ant-')) {
    showApiError('La API key debe comenzar con sk-ant-');
    return;
  }
  userApiKey = key;
  hideApiKeyModal();
  initApp();
}

function showApiError(msg) {
  const el = document.getElementById('apiError');
  el.textContent = msg;
  el.style.display = 'block';
}

document.getElementById('apiKeyInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmApiKey();
});

// ──────────────────────────────────────────────
//  INICIALIZACIÓN
// ──────────────────────────────────────────────
function initApp() { setMode('ftc'); }

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['ftc', 'fgc', 'debug', 'strategy'][i] === mode);
  });
  conversationHistory = [];
  document.getElementById('chatArea').innerHTML = '';
  renderQuickBtns();

  const WELCOMES = {
    ftc:      `¡Hola, futuro/a ingeniero/a! 🐦\n\nSoy RoboRobin, listo para ayudarte con el **FTC DECODE 2025-2026**. Tengo el manual oficial del juego y puedo responder sobre reglas, puntuación, campo, hardware y estrategia. ¿Qué necesitas hoy?`,
    fgc:      `¡Bienvenido/a, representante de El Salvador! 🌍🐦\n\nEl **FGC 2026 - Igniting Innovation** nos espera. Puedo ayudarte con mecánica, hardware y estrategia. ¿Por dónde empezamos?`,
    debug:    `¡Modo diagnóstico activado! 🔧🐦\n\nCuéntame el problema con el mayor detalle posible para resolverlo juntos. ¿Qué está fallando?`,
    strategy: `¡Hora de pensar como campeones! 🏆🐦\n\nPuedo ayudarte a planificar la estrategia para maximizar puntos y RANKING POINTS. ¿Por dónde empezamos?`
  };
  addBotMessage(WELCOMES[mode]);
}

function renderQuickBtns() {
  document.getElementById('quickBtns').innerHTML = QUICK[currentMode]
    .map(q => `<button class="qbtn" onclick="sendQuick('${q.replace(/'/g, "\\'")}')">💬 ${q}</button>`)
    .join('');
}

function clearChat() { setMode(currentMode); }

// ──────────────────────────────────────────────
//  UI: MENSAJES
// ──────────────────────────────────────────────
function addBotMessage(text) {
  const chat = document.getElementById('chatArea');
  const div  = document.createElement('div');
  div.className = 'msg msg-bot';
  div.innerHTML = `
    <div class="avatar"><img src="../images/robin.png" alt="RR"></div>
    <div class="bubble bubble-bot">${formatMsg(text)}</div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addUserMessage(text) {
  const chat = document.getElementById('chatArea');
  const div  = document.createElement('div');
  div.className = 'msg msg-user';
  div.innerHTML = `<div class="avatar avatar-user">Tú</div><div class="bubble bubble-user">${escHtml(text)}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const chat = document.getElementById('chatArea');
  const div  = document.createElement('div');
  div.className = 'msg msg-bot'; div.id = 'typing';
  div.innerHTML = `
    <div class="avatar"><img src="../images/robin.png" alt="RR"></div>
    <div class="bubble bubble-bot">
      <div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
    </div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

function formatMsg(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _l, code) => `<pre>${escHtml(code.trim())}</pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendQuick(txt) {
  document.getElementById('userInput').value = txt;
  sendMessage();
}

// ──────────────────────────────────────────────
//  ENVÍO DE MENSAJE → RAILWAY → CLAUDE HAIKU 4.5
// ──────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;
  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  addUserMessage(text);
  conversationHistory.push({ role: 'user', content: text });

  isLoading = true;
  document.getElementById('sendBtn').disabled = true;
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system:   buildSystem(currentMode),
        messages: conversationHistory,
        apiKey:   userApiKey        // ← se envía al servidor Railway
      })
    });

    removeTyping();

    if (response.status === 401 || response.status === 403) {
      addBotMessage('⚠️ **API key inválida o sin permisos.** Recarga la página e ingresa una clave válida desde console.anthropic.com');
      conversationHistory.pop();
    } else if (response.status === 429) {
      addBotMessage('⚠️ **Límite de cuota alcanzado.** Espera un momento y vuelve a intentarlo.');
      conversationHistory.pop();
    } else if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}`;
      addBotMessage(`❌ **Error:** ${msg}`);
      conversationHistory.pop();
    } else {
      const data = await response.json();
      const reply = data?.content?.[0]?.text || '⚠️ No obtuve una respuesta clara. Intenta reformular tu pregunta.';
      conversationHistory.push({ role: 'assistant', content: reply });
      addBotMessage(reply);
    }
  } catch (e) {
    removeTyping();
    addBotMessage('❌ **Error de conexión con el servidor.** Verifica que Railway esté online e intenta de nuevo.');
    conversationHistory.pop();
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('userInput').focus();
}

document.getElementById('userInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
