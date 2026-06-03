// Carga las variables de entorno desde el archivo .env
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Esta es la ruta que tu HTML llamará
app.post('/api/chat', async (req, res) => {
    try {
        const { contents } = req.body;
        
        // ¡LA LÍNEA DEL .ENV! Aquí tomamos la clave de forma segura en el servidor
        const apiKey = process.env.GEMINI_API_KEY; 

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        res.json(data);

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor de RoboRobin corriendo en http://localhost:${PORT}`);
});
