/* ─────────────────────────────────────────────
   RoboCoach · Orbital Kronnos
   roborobin/roborobin.js
   ───────────────────────────────────────────── */

/* ── SYSTEM PROMPTS ── */
const SYSTEMS = {
  ftc: `Eres RoboCoach, experto en programación de robots FTC para estudiantes del programa STEAM Maker de FUSALMO (Fundación Salvador del Mundo) en El Salvador. Tu misión es ayudar a los jóvenes a programar su robot para el FTC 2025-2026 DECODE™ Presented by RTX.

CONOCIMIENTO DEL JUEGO FTC DECODE 2025-2026:
- El juego usa ARTIFACTs: bolas de polipropileno (24 purple, 12 green) de 5 pulgadas aprox.
- El campo tiene: GOAL (con SQUARE diverter y RAMP de 9 posiciones), BASE ZONE, LAUNCH ZONE, LOADING ZONE, SPIKE MARKS, DEPOT, OBELISK
- MOTIFS: 3 patrones (GPP, PGP, PPG) definidos por el OBELISK al inicio del MATCH
- RAMP tiene 9 índices; un ARTIFACT es CLASSIFIED si cae directamente al RAMP; OVERFLOW si pasa el SQUARE pero rebota sobre otros
- Los ARTIFACTs preloaded: hasta 3 por robot desde su ALLIANCE AREA

PUNTUACIÓN FTC DECODE:
- AUTO (30 segundos): LEAVE=3pts, CLASSIFIED ARTIFACT=3pts, OVERFLOW ARTIFACT=1pt
- TELEOP (2 minutos): CLASSIFIED=3pts, OVERFLOW=1pt, DEPOT=1pt
- PATTERN: 2pts por ARTIFACT que coincide con el MOTIF en su índice del RAMP
- BASE: Parcialmente retornado=5pts, Totalmente retornado=10pts, BONO 2 robots totalmente retornados=+10pts

PROGRAMACIÓN FTC:
- Lenguaje recomendado: Blocks o OnBot Java
- Clases principales: LinearOpMode, DcMotor, Servo, HardwareMap, Gamepad1/2
- IMU integrado en Control Hub para orientación

ESTRUCTURA BÁSICA JAVA FTC:
\`\`\`java
@TeleOp(name="MiRobot TeleOp")
public class MiRobotTeleOp extends LinearOpMode {
  DcMotor motorIzq, motorDer;
  @Override
  public void runOpMode() {
    motorIzq = hardwareMap.get(DcMotor.class, "motorIzq");
    motorDer = hardwareMap.get(DcMotor.class, "motorDer");
    motorDer.setDirection(DcMotor.Direction.REVERSE);
    waitForStart();
    while (opModeIsActive()) {
      double forward = -gamepad1.left_stick_y;
      double turn = gamepad1.right_stick_x;
      motorIzq.setPower(forward + turn);
      motorDer.setPower(forward - turn);
    }
  }
}
\`\`\`

Responde en español claro para jóvenes de 12-17 años. Sé motivador. Da código cuando ayude.`,

  fgc: `Eres RoboCoach, experto en programación de robots para el First Global Challenge 2026 "Igniting Innovation" para estudiantes del programa STEAM Maker de FUSALMO en El Salvador. El FGC 2026 se realizará en Incheon, República de Corea.

CAMPO: 7m×7m, SUPPRESSION UNITS (rojo y azul), EXTINGUISHER (centro), FIRE SHIELDS (esquinas), BRACES.
GAME PIECES: WILDFIRE — bolas de espuma 100mm, 500 por MATCH.
MATCH: 2 minutos 30 segundos.

PUNTUACIÓN FGC:
- WILDFIRE en SUPPRESSION UNIT: 1pt × CLIMB MULTIPLIER
- WILDFIRE en EXTINGUISHER: 1pt (toda la alianza global)
- CLIMB MULTIPLIER: base 1.0 + ZONE1=+0.10, ZONE2=+0.20, ZONE3=+0.30 por robot
- PARTNER CLIMB: 25pts por robot soportado por otro
- COOPERTITION BONUS: 4 robots ZONE3=10pts, 5=25pts, 6=40pts

Responde en español, motiva al equipo como representantes de El Salvador en Corea del Sur.`,

  debug: `Eres RoboCoach, especialista en resolución de problemas de robots para STEAM Maker FUSALMO.

DIAGNÓSTICO: 1) ¿Hardware? 2) ¿Código? 3) ¿Configuración? 4) ¿Comunicación?

PROBLEMAS COMUNES:
- Motor no responde: verificar nombre en hardwareMap, dirección, inicialización
- OpMode no aparece: verificar anotación @TeleOp/@Autonomous, compilación, WiFi
- Robot va al revés: cambiar Direction.REVERSE al motor correcto
- RunToPosition no funciona: setMode + setTargetPosition + setPower + esperar isBusy()

CÓDIGO DEBUG:
\`\`\`java
telemetry.addData("Motor Power", motorIzq.getPower());
telemetry.addData("Gamepad Y", gamepad1.left_stick_y);
telemetry.update();
\`\`\`

Responde en español con calma. Los errores son parte del aprendizaje.`,

  strategy: `Eres RoboCoach, estratega experto para STEAM Maker FUSALMO, El Salvador.

FTC DECODE PRIORIDADES:
1. AUTO: LEAVE(3) + CLASSIFIED(3c/u)
2. CLASSIFIED > OVERFLOW siempre (3 vs 1pt)
3. PATTERN: conocer MOTIF y priorizar colores correctos
4. BASE al final: 10pts + bono 10pts si ambos robots regresan = 20pts extra

FGC PRIORIDADES:
1. Máximo WILDFIRE al SUPPRESSION UNIT
2. ZONE 3 en BRACE = ×1.30 por robot (3 robots = ×1.90)
3. PARTNER CLIMB: 25pts por robot
4. COOPERTITION BONUS requiere coordinación con 6 equipos

Responde con datos y análisis. Ayuda al equipo a tomar decisiones inteligentes.`
};

/* ── QUICK BUTTONS ── */
const QUICK = {
  ftc:      ['¿Cómo muevo el robot con gamepad?','Estructura TeleOp en Java','Estructura Autonomous','¿Cómo leer sensor de color?','Control de servos','Encoders y RunToPosition','¿Qué es el MOTIF?','Puntos BASE'],
  fgc:      ['¿Cómo inicio el código?','Recoger y soltar WILDFIRE','¿Cómo funciona el CLIMB?','Calcular puntaje máximo','Reglas importantes','¿Qué hace el HUMAN PLAYER?','Coordinación con alianza','Modo autónomo'],
  debug:    ['Robot no se mueve','OpMode no aparece','Error de compilación','Sensor no lee','Robot va al revés','Robot no para en auto','Problema con CLIMB','Motores se calientan'],
  strategy: ['¿Qué priorizar en FTC?','Ganar RANKING POINTS','Estrategia alianza FGC','Calcular puntaje FGC','Plan BRACE','Alianza internacional','Qué practicar','Preparar AUTO period']
};

/* ── WELCOME MESSAGES ── */
const WELCOME = {
  ftc:      `¡Hola, futuro/a ingeniero/a! 🤖\n\nEstoy listo para ayudarte con el **FTC DECODE 2025-2026**. ¿Qué necesitas trabajar hoy? Puedo ayudarte con código Java, configuración de hardware, sensores, o cualquier duda del juego. ¡El equipo de El Salvador tiene todo para brillar! 🇸🇻`,
  fgc:      `¡Bienvenido/a, representante de El Salvador! 🌍🔥\n\nEl **FGC 2026 - Igniting Innovation** nos lleva a Incheon, Corea del Sur. Tu misión: meter WILDFIRE en la SUPPRESSION UNIT y trepar el BRACE para multiplicar puntos. ¿Qué quieres aprender hoy?`,
  debug:    `¡Modo diagnóstico activado! 🔧\n\nCuéntame el problema:\n- ¿Qué **debería** hacer el robot?\n- ¿Qué hace **en realidad**?\n- ¿Hay algún **mensaje de error**?\n\nMientras más detalle, más rápido lo resolvemos.`,
  strategy: `¡Hora de pensar como campeones! 🏆\n\nPuedo ayudarte a planificar la estrategia ganadora para **FTC DECODE** o **FGC Igniting Innovation**. ¿Por dónde empezamos?`
};

/* ── STATE ── */
let currentMode = 'ftc';
let history     = [];
let isLoading   = false;
let apiKey      = localStorage.getItem('robocoach_key') || '';

/* ── INIT ── */
window.addEventListener('load', () => {
  if (apiKey) {
    document.getElementById('apiModal').style.display = 'none';
  }
  setMode('ftc');
});

/* ── API KEY ── */
function saveApiKey() {
  const v = document.getElementById('apiKeyInput').value.trim();
  if (!v.startsWith('sk-ant')) {
    alert('La API Key debe empezar con sk-ant-...');
    return;
  }
  apiKey = v;
  localStorage.setItem('robocoach_key', apiKey);
  document.getElementById('apiModal').style.display = 'none';
  setMode('ftc');
}

function changeKey() {
  document.getElementById('apiKeyInput').value = '';
  document.getElementById('apiModal').style.display = 'flex';
}

/* ── MODE ── */
function setMode(mode) {
  currentMode = mode;
  const modeNames = ['ftc', 'fgc', 'debug', 'strategy'];
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', modeNames[i] === mode);
  });
  renderQuickBtns();
  history = [];
  document.getElementById('chatArea').innerHTML = '';
  addBotMsg(WELCOME[mode]);
}

/* ── QUICK BUTTONS ── */
function renderQuickBtns() {
  document.getElementById('quickBtns').innerHTML = QUICK[currentMode]
    .map(q => `<button class="qbtn" onclick="sendQuick('${q.replace(/'/g, "\\'")}')">💬 ${q}</button>`)
    .join('');
}

/* ── CHAT HELPERS ── */
function addBotMsg(text) {
  const chat = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = 'msg msg-bot';
  d.innerHTML = `<div class="avatar avatar-bot">RC</div><div class="bubble bubble-bot">${fmt(text)}</div>`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function addUserMsg(text) {
  const chat = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = 'msg msg-user';
  d.innerHTML = `<div class="avatar avatar-user">Tú</div><div class="bubble bubble-user">${esc(text)}</div>`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const chat = document.getElementById('chatArea');
  const d = document.createElement('div');
  d.className = 'msg msg-bot';
  d.id = 'typing';
  d.innerHTML = `<div class="avatar avatar-bot">RC</div><div class="bubble bubble-bot"><div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

/* ── FORMATTERS ── */
function fmt(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, code) => `<pre>${esc(code.trim())}</pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── SEND ── */
function sendQuick(txt) {
  document.getElementById('userInput').value = txt;
  sendMessage();
}

function clearChat() {
  history = [];
  setMode(currentMode);
}

async function sendMessage() {
  if (isLoading || !apiKey) return;

  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  addUserMsg(text);
  history.push({ role: 'user', content: text });

  isLoading = true;
  document.getElementById('sendBtn').disabled = true;
  showTyping();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEMS[currentMode],
        messages: history
      })
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      const msg = data.error.type === 'authentication_error'
        ? '❌ API Key inválida. Haz clic en "Cambiar API Key".'
        : '❌ Error: ' + data.error.message;
      addBotMsg(msg);
    } else {
      const reply = data?.content?.[0]?.text || 'Lo siento, hubo un error.';
      history.push({ role: 'assistant', content: reply });
      addBotMsg(reply);
    }
  } catch (e) {
    removeTyping();
    addBotMsg('❌ Error de conexión. Verifica tu internet.');
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('userInput').focus();
}

/* ── KEYBOARD ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });
});