require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// ── Ruta principal que llama a Claude ──
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, apiKey } = req.body;

    // La API key viene desde el frontend (enviada por el usuario)
    // Si no hay en el body, usa la del .env como fallback
    const key = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!key) {
      return res.status(400).json({ error: { message: 'No se recibió API key. Recarga la página e ingrésala de nuevo.' } });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     system,
        messages:   messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor' } });
  }
});

// ── Ruta para verificar que el servidor está vivo ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: 'claude-haiku-4-5-20251001' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 RoboRobin corriendo en http://localhost:${PORT}`);
});
