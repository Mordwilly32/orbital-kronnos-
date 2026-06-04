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
  initApp();
}

window.addEventListener('load', checkSessionAndLoad);

// ──────────────────────────────────────────────
//  CONFIGURACIÓN DE API
//  En desarrollo apunta a localhost.
//  Cuando subas server.js a Railway/Render,
//  cambia la segunda URL por la de tu servidor.
// ──────────────────────────────────────────────
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/chat'
  : 'https://TU-SERVIDOR.railway.app/api/chat'; // ← cambia esto al hacer deploy

// ──────────────────────────────────────────────
//  SYSTEM PROMPTS POR MODO
// ──────────────────────────────────────────────
const SYSTEMS = {
  ftc: `Eres RoboRobin, experto en programación de robots FTC para estudiantes del programa STEAM Maker de FUSALMO en El Salvador. Responde siempre en español claro para jóvenes de 12-17 años. El desafío de este año es FTC 2025-2026 DECODE. Usa ejemplos concretos, explica paso a paso y fomenta el aprendizaje. Cuando des código, usa Java con el SDK de FTC.`,
  fgc: `Eres RoboRobin, experto en programación de robots para el First Global Challenge 2026 "Igniting Innovation" para el equipo de FUSALMO representando a El Salvador. El desafío trata sobre prevención de incendios forestales. Responde en español claro para jóvenes de 12-17 años.`,
  debug: `Eres RoboRobin, especialista en diagnóstico y resolución de problemas técnicos y de código de robots para el equipo STEAM Maker de FUSALMO El Salvador. Pide siempre el mensaje de error completo y el fragmento de código relevante. Da soluciones paso a paso.`,
  strategy: `Eres RoboRobin, estratega experto para competiciones de robótica FTC y FGC para FUSALMO El Salvador. Ayuda a planificar puntuaciones, selección de alianzas, orden de tareas en el autonomous y tele-op, y estrategias para maximizar puntos.`
};

const QUICK = {
  ftc:      ["¿Cómo muevo el robot con gamepad?", "Estructura TeleOp en Java", "¿Cómo leer un sensor de color?", "Encoders y RunToPosition"],
  fgc:      ["¿Cómo empiezo el código del robot?", "Recoger y soltar WILDFIRE", "¿Cómo funciona el CLIMB?", "¿Qué hace el HUMAN PLAYER?"],
  debug:    ["Mi robot no se mueve", "OpMode no aparece en Driver Hub", "Error de compilación Java", "Robot va al revés"],
  strategy: ["¿Qué debo priorizar en FTC?", "Cómo ganar RANKING POINTS", "Estrategia de alianza FGC", "Plan para el BRACE en FGC"]
};

// ──────────────────────────────────────────────
//  ESTADO DE LA APP
// ──────────────────────────────────────────────
let currentMode = 'ftc';
let conversationHistory = [];  // formato Claude: [{role:'user', content:'...'}, {role:'assistant', content:'...'}]
let isLoading = false;

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
    ftc:      `¡Hola, futuro/a ingeniero/a! 🐦\n\nSoy RoboRobin, y estoy listo para ayudarte con el **FTC DECODE 2025-2026**. ¿Qué necesitas trabajar hoy? Puedo ayudarte con código Java, configuración de hardware o sensores.`,
    fgc:      `¡Bienvenido/a, representante de El Salvador! 🌍🐦\n\nEl **FGC 2026 - Igniting Innovation** nos espera. ¿Qué software o mecanismo de recolección quieres estructurar hoy?`,
    debug:    `¡Modo diagnóstico activado! 🔧🐦\n\nCuéntame el problema con el mayor detalle posible o compárteme el error de compilación para resolverlo juntos.`,
    strategy: `¡Hora de pensar como campeones! 🏆🐦\n\nPuedo ayudarte a planificar la estrategia para maximizar puntos en la arena de competencia. ¿Por dónde empezamos?`
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
//  ENVÍO DE MENSAJE → CLAUDE HAIKU 4.5
// ──────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;
  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  addUserMessage(text);

  // Claude usa role 'user' y 'assistant', y content es string directo
  conversationHistory.push({ role: 'user', content: text });

  isLoading = true;
  document.getElementById('sendBtn').disabled = true;
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system:   SYSTEMS[currentMode],
        messages: conversationHistory
      })
    });

    removeTyping();

    if (response.status === 429) {
      addBotMessage('⚠️ **Límite de cuota alcanzado.** Espera un momento y vuelve a intentarlo.');
      conversationHistory.pop();
    } else if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}`;
      addBotMessage(`❌ **Error de la API:** ${msg}`);
      conversationHistory.pop();
    } else {
      const data = await response.json();
      // Claude responde con: data.content[0].text
      const reply = data?.content?.[0]?.text || '⚠️ No obtuve una respuesta clara. Intenta reformular tu pregunta.';
      conversationHistory.push({ role: 'assistant', content: reply });
      addBotMessage(reply);
    }
  } catch (e) {
    removeTyping();
    addBotMessage('❌ **Error de conexión:** ¿Está corriendo el servidor? Ejecuta <code>node server.js</code> en la terminal.');
    conversationHistory.pop();
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('userInput').focus();
}

document.getElementById('userInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
