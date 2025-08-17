const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
app.use(express.json());

// Clave secreta para JWT.
const JWT_SECRET = 'super_secret_nfc_app_key_2025_final_fix_xyz';

// Middleware de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://nfc-app-frontend.onrender.com');
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS,PUT,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        console.log('Handling CORS preflight request');
        return res.sendStatus(200);
    }
    next();
});

// Middleware para proteger rutas
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Token no encontrado' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Error:', err.message);
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

// =================================================================
// Rutas de Autenticación
// =================================================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre AS rol, e.nombre AS empresa, e.id AS empresa_id FROM usuarios u JOIN roles r ON u.rol_id = r.id JOIN empresas e ON u.empresa_id = e.id WHERE u.email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (passwordMatch) {
            const token = jwt.sign({
                id: user.id, email: user.email, rol: user.rol, empresa_id: user.empresa_id
            }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ access_token: token });
        }
        res.status(401).json({ message: 'Credenciales inválidas' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// =================================================================
// Rutas del Dashboard Privado
// =================================================================
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    const { empresa_id, rol } = req.user;
    if (rol !== 'super_admin') {
        return res.status(403).json({ message: 'No tienes permiso para ver usuarios.' });
    }
    try {
        const { rows } = await pool.query('SELECT u.id, u.nombre, u.email, r.nombre AS rol, e.nombre AS empresa FROM usuarios u JOIN roles r ON u.rol_id = r.id JOIN empresas e ON u.empresa_id = e.id WHERE u.empresa_id = $1 ORDER BY u.id', [empresa_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.post('/api/admin/register', authenticateToken, async (req, res) => {
    const { nombre, email, password } = req.body;
    const { empresa_id, rol } = req.user;
    if (rol !== 'super_admin') {
        return res.status(403).json({ message: 'No tienes permiso para crear usuarios.' });
    }
    try {
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol_id, empresa_id) VALUES ($1, $2, $3, 2, $4) RETURNING *', [nombre, email, password_hash, empresa_id]);
        res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rol } = req.user;
    if (rol !== 'super_admin') {
        return res.status(403).json({ message: 'No tienes permiso para eliminar usuarios.' });
    }
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ message: 'Usuario eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get('/api/empresa', authenticateToken, async (req, res) => {
    const { empresa_id } = req.user;
    try {
        const { rows } = await pool.query('SELECT nombre FROM empresas WHERE id = $1', [empresa_id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        res.json({ nombre: rows[0].nombre });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get('/api/nfc-tags', authenticateToken, async (req, res) => {
    const { empresa_id } = req.user;
    try {
        const { rows } = await pool.query('SELECT id, tag_id, data, public_url FROM nfc_tags WHERE empresa_id = $1 ORDER BY id', [empresa_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.post('/api/nfc-tags', authenticateToken, async (req, res) => {
    const { tagId, tagName, publicUrl } = req.body;
    const { empresa_id } = req.user;
    try {
        await pool.query('INSERT INTO nfc_tags (tag_id, data, public_url, empresa_id) VALUES ($1, $2, $3, $4)', [tagId, tagName, publicUrl, empresa_id]);
        res.status(201).json({ message: 'Tag NFC creado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.delete('/api/nfc-tags/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM nfc_tags WHERE id = $1', [id]);
        res.json({ message: 'Tag NFC eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get('/api/nfc-taps', authenticateToken, async (req, res) => {
    const { empresa_id } = req.user;
    try {
        const { rows } = await pool.query('SELECT t.id, t.tag_id, t.timestamp, t.ip_address, t.user_agent, t.location_data FROM nfc_taps t JOIN nfc_tags n ON t.tag_id = n.tag_id WHERE n.empresa_id = $1 ORDER BY t.timestamp DESC', [empresa_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// =================================================================
// Rutas de Tap y Redirección Pública (Sin autenticación)
// =================================================================
app.post('/api/tap-event', async (req, res) => {
    const { tagId, locationData, clientInfo } = req.body;
    try {
        // **CAMBIO CLAVE:** Obtener el empresa_id del tag de la base de datos
        const tagResult = await pool.query('SELECT empresa_id FROM nfc_tags WHERE tag_id = $1', [tagId]);
        if (tagResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tag NFC no encontrado.' });
        }
        const empresa_id = tagResult.rows[0].empresa_id;
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const user_agent = req.headers['user-agent'];
        await pool.query(
            'INSERT INTO nfc_taps (tag_id, ip_address, user_agent, location_data, empresa_id) VALUES ($1, $2, $3, $4, $5)',
            [tagId, ip_address, user_agent, locationData]
        );
        res.status(201).json({ message: 'Tap registrado con éxito.' });
    } catch (err) {
        console.error("Error al registrar tap:", err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/public/tag-info/:tagId', async (req, res) => {
    const { tagId } = req.params;
    try {
        const { rows } = await pool.query('SELECT public_url FROM nfc_tags WHERE tag_id = $1', [tagId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tag NFC no encontrado.' });
        }
        // **CAMBIO CLAVE:** Añadir un log para ver la URL antes de enviarla
        console.log('URL de redirección obtenida de la DB:', rows[0].public_url);
        
        res.json({ public_url: rows[0].public_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend escuchando en el puerto ${PORT}`);
});