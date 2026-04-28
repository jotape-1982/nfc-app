from flask import Flask, request, jsonify, make_response
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, get_jwt
from flask_sqlalchemy import SQLAlchemy
import os
import datetime
import logging

app = Flask(__name__)

# -----------------------------------------------------------------------
# CORS manual
# -----------------------------------------------------------------------
def get_allowed_origins():
    env_origins = os.environ.get('ALLOWED_ORIGINS', '')
    if env_origins:
        return [o.strip().rstrip('/') for o in env_origins.split(',') if o.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

def apply_cors(response):
    origin = request.headers.get('Origin', '')
    allowed = get_allowed_origins()
    if origin in allowed:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
    return response

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        return apply_cors(response)

@app.after_request
def add_cors_headers(response):
    return apply_cors(response)

# -----------------------------------------------------------------------
# Configuración
# -----------------------------------------------------------------------
database_url = os.environ.get('DATABASE_URL', 'postgresql://user:password@db:5432/nfc')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,       # verifica la conexión antes de usarla
    'pool_recycle': 300,         # recicla conexiones cada 5 minutos
    'pool_size': 5,
    'max_overflow': 2,
}
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super_secret_nfc_app_key_2025_final_fix_xyz')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# --- Manejadores de Errores JWT ---
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Token de acceso faltante o inválido. Por favor, inicia sesión de nuevo."}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({"message": "Token de acceso inválido o expirado. Por favor, inicia sesión de nuevo."}), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_response(callback):
    return jsonify({"message": "El token no es fresco. Por favor, inicia sesión de nuevo."}), 401

@jwt.revoked_token_loader
def revoked_token_response(callback):
    return jsonify({"message": "El token ha sido revocado."}), 401

# --- Modelos ---
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)

class Empresa(db.Model):
    __tablename__ = 'empresas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), unique=True, nullable=False)

class User(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    rol_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)

    rol = db.relationship('Role', backref='usuarios')
    empresa = db.relationship('Empresa', backref='usuarios')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class NfcTag(db.Model):
    __tablename__ = 'nfc_tags'
    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.String(255), unique=True, nullable=False)
    data = db.Column(db.Text)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)
    public_url = db.Column(db.String(255))

    empresa = db.relationship('Empresa', backref='nfc_tags')

class NfcTap(db.Model):
    __tablename__ = 'nfc_taps'
    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True), default=db.func.now())
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    location_data = db.Column(db.Text)
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)

    empresa = db.relationship('Empresa', backref='nfc_taps')

# --- Rutas de Autenticación ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    rol_id = data.get('rol_id')
    empresa_id = data.get('empresa_id')

    if not all([nombre, email, password, rol_id, empresa_id]):
        return jsonify({'message': 'Faltan campos obligatorios'}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({'message': 'El usuario ya existe'}), 409

    new_user = User(nombre=nombre, email=email, rol_id=rol_id, empresa_id=empresa_id)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Usuario creado con éxito'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        empresa_id_for_token = int(user.empresa_id) if user.empresa_id is not None else None
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'rol': user.rol.nombre,
                'empresa_id': empresa_id_for_token
            }
        )
        app.logger.info(f"Login exitoso para {email}.")
        return jsonify(access_token=access_token), 200
    else:
        app.logger.warning(f"Intento de login fallido para {email}.")
        return jsonify({'message': 'Credenciales inválidas'}), 401

# --- Helper JWT ---
def get_user_info_from_jwt():
    try:
        claims = get_jwt()
        if not isinstance(claims, dict):
            return None, None, {"message": "Datos de sesión inválidos."}, 401

        empresa_id_raw = claims.get('empresa_id')
        rol = claims.get('rol')

        if empresa_id_raw is None:
            return None, None, {"message": "Datos de sesión inválidos: ID de empresa faltante."}, 401

        try:
            empresa_id = int(empresa_id_raw)
        except (TypeError, ValueError) as e:
            app.logger.error(f"Error al convertir empresa_id: {e}")
            return None, None, {"message": "Datos de sesión inválidos: ID de empresa incorrecto."}, 401

        return empresa_id, rol, None, None
    except Exception as e:
        app.logger.error(f"Error inesperado en JWT: {e}", exc_info=True)
        return None, None, {"message": "Error interno al procesar el token."}, 500

# --- Rutas NFC Tags ---
@app.route('/api/nfc-tags', methods=['GET'])
@jwt_required()
def get_nfc_tags():
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        tags = NfcTag.query.filter_by(empresa_id=empresa_id).all()
        output = [{'id': tag.id, 'tag_id': tag.tag_id, 'data': tag.data, 'public_url': tag.public_url} for tag in tags]
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"Error al obtener tags NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/nfc-tags', methods=['POST'])
@jwt_required()
def add_nfc_tag():
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    data = request.get_json()
    tag_id = data.get('tagId')
    tag_data = data.get('tagName')
    public_url = data.get('publicUrl')
    try:
        if not tag_id or not tag_data or not public_url:
            return jsonify({'message': 'Faltan campos obligatorios: tagId, tagName y publicUrl'}), 400
        new_tag = NfcTag(tag_id=tag_id, data=tag_data, public_url=public_url, empresa_id=empresa_id)
        db.session.add(new_tag)
        db.session.commit()
        return jsonify({'message': 'Tag NFC añadido con éxito'}), 201
    except Exception as e:
        app.logger.error(f"Error al añadir tag NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/nfc-tags/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_nfc_tag(id):
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        tag = NfcTag.query.filter_by(id=id, empresa_id=empresa_id).first_or_404()
        db.session.delete(tag)
        db.session.commit()
        return jsonify({'message': 'Tag NFC eliminado con éxito'}), 200
    except Exception as e:
        app.logger.error(f"Error al eliminar tag NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

# --- Rutas NFC Taps ---
@app.route('/api/nfc-taps', methods=['GET'])
@jwt_required()
def get_nfc_taps():
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        taps = NfcTap.query.filter_by(empresa_id=empresa_id).all()
        output = [
            {
                'id': tap.id,
                'tag_id': tap.tag_id,
                'timestamp': tap.timestamp.isoformat(),
                'ip_address': tap.ip_address,
                'user_agent': tap.user_agent,
                'location_data': tap.location_data,
                'empresa_id': tap.empresa_id
            } for tap in taps
        ]
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"Error al obtener taps NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

# --- Rutas Públicas ---
@app.route('/api/public/tag-info/<string:tag_id>', methods=['GET'])
def get_public_tag_info(tag_id):
    try:
        tag = NfcTag.query.filter_by(tag_id=tag_id).first()
        if not tag:
            return jsonify({'message': 'Tag NFC no encontrado o inválido.'}), 404
        return jsonify({
            'tag_id': tag.tag_id,
            'public_url': tag.public_url,
            'empresa_id': tag.empresa_id
        }), 200
    except Exception as e:
        app.logger.error(f"Error al obtener info pública del tag: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/tap-event', methods=['POST'])
def register_tap_event():
    data = request.get_json()
    tag_id = data.get('tagId')
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    location_data = data.get('locationData')

    if not tag_id:
        return jsonify({'message': 'ID del tag es obligatorio.'}), 400

    try:
        nfc_tag = NfcTag.query.filter_by(tag_id=tag_id).first()
        if not nfc_tag:
            return jsonify({'message': 'Tag NFC no encontrado.'}), 404

        new_tap = NfcTap(
            tag_id=tag_id,
            ip_address=ip_address,
            user_agent=user_agent,
            location_data=location_data,
            empresa_id=nfc_tag.empresa_id
        )
        db.session.add(new_tap)
        db.session.commit()
        return jsonify({'message': 'Tap registrado con éxito'}), 201
    except Exception as e:
        app.logger.error(f"Error al registrar tap: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

# --- Rutas Administración ---
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        if rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403
        users = User.query.filter_by(empresa_id=empresa_id).all()
        output = [{'id': user.id, 'nombre': user.nombre, 'email': user.email, 'rol': user.rol.nombre, 'empresa': user.empresa.nombre} for user in users]
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"Error al obtener usuarios: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/admin/register', methods=['POST'])
@jwt_required()
def admin_register():
    empresa_id, admin_rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        if admin_rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403

        data = request.get_json()
        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        rol_id = data.get('rol_id', 2)
        empresa_id_from_request = data.get('empresa_id', empresa_id)

        if not all([nombre, email, password]):
            return jsonify({'message': 'Faltan campos obligatorios'}), 400

        if empresa_id_from_request != empresa_id:
            return jsonify({'message': 'No puedes crear usuarios en otra empresa'}), 403

        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({'message': 'El usuario ya existe'}), 409

        new_user = User(nombre=nombre, email=email, rol_id=rol_id, empresa_id=empresa_id_from_request)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Usuario creado con éxito'}), 201
    except Exception as e:
        app.logger.error(f"Error al registrar usuario admin: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/admin/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    empresa_id, admin_rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        if admin_rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403
        user = User.query.filter_by(id=id, empresa_id=empresa_id).first_or_404()
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'Usuario eliminado con éxito'}), 200
    except Exception as e:
        app.logger.error(f"Error al eliminar usuario: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/empresa', methods=['GET'])
@jwt_required()
def get_empresa_info():
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code
    try:
        empresa = Empresa.query.get(empresa_id)
        if not empresa:
            return jsonify({'message': 'Empresa no encontrada'}), 404
        return jsonify({'nombre': empresa.nombre}), 200
    except Exception as e:
        app.logger.error(f"Error al obtener empresa: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

@app.route('/api/client-log', methods=['POST'])
def client_log():
    log_data = request.get_json()
    level = log_data.get('level', 'INFO').upper()
    message = log_data.get('message', 'No message provided')
    timestamp = log_data.get('timestamp', datetime.datetime.now().isoformat())
    user_agent = request.headers.get('User-Agent', 'N/A')
    source_url = log_data.get('sourceUrl', 'N/A')

    log_entry = f"CLIENT_LOG [{timestamp}] [{level}] (URL: {source_url}, UA: {user_agent}): {message}"

    if level == 'ERROR':
        app.logger.error(log_entry)
    elif level == 'WARN':
        app.logger.warning(log_entry)
    else:
        app.logger.info(log_entry)

    return jsonify({"status": "success"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
