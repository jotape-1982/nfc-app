from flask import Flask, request, jsonify, redirect
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, get_jwt
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import logging
import json # Importar para manejar JSON

app = Flask(__name__)

# Configuración de CORS para toda la aplicación Flask
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"], "supports_credentials": True}})

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@db:5432/nfc')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super_secret_nfc_app_key_2025_final_fix_xyz' 

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Configurar logging para la aplicación Flask
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# --- Manejadores de Errores para Flask-JWT-Extended ---
@jwt.unauthorized_loader
def unauthorized_response(callback):
    app.logger.error(f"JWT Unauthorized Error: {callback}")
    return jsonify({"message": "Token de acceso faltante o inválido. Por favor, inicia sesión de nuevo."}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    app.logger.error(f"JWT Invalid Token Error: {callback}")
    return jsonify({"message": "Token de acceso inválido o expirado. Por favor, inicia sesión de nuevo."}), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_response(callback):
    app.logger.error(f"JWT Token Not Fresh Error: {callback}")
    return jsonify({"message": "El token no es fresco. Por favor, inicia sesión de nuevo."}), 401

@jwt.revoked_token_loader
def revoked_token_response(callback):
    app.logger.error(f"JWT Revoked Token Error: {callback}")
    return jsonify({"message": "El token ha sido revocado."}), 401

# --- Modelos de la Base de Datos ---
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
    location_data = db.Column(db.Text) # Almacenará los datos de geolocalización como JSON string
    empresa_id = db.Column(db.Integer, db.ForeignKey('empresas.id'), nullable=False)

    empresa = db.relationship('Empresa', backref='nfc_taps')

# --- Rutas de Autenticación ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
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
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        empresa_id_for_token = int(user.empresa_id) if user.empresa_id is not None else None
        
        app.logger.info(f"Login: user.empresa_id desde DB: {user.empresa_id} (type: {type(user.empresa_id)})")
        app.logger.info(f"Login: empresa_id_for_token en JWT: {empresa_id_for_token} (type: {type(empresa_id_for_token)})")

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'rol': user.rol.nombre,
                'empresa_id': empresa_id_for_token
            }
        )
        app.logger.info(f"Login exitoso para {email}. Token creado.")
        return jsonify(access_token=access_token), 200
    else:
        app.logger.warning(f"Intento de login fallido para {email}.")
        return jsonify({'message': 'Credenciales inválidas'}), 401

# --- Función auxiliar para obtener datos de usuario del JWT ---
def get_user_info_from_jwt():
    try:
        user_id_from_jwt = get_jwt_identity() 
        claims = get_jwt() 
        
        app.logger.info(f"get_user_info_from_jwt: User ID from identity: {user_id_from_jwt} (type: {type(user_id_from_jwt)})")
        app.logger.info(f"get_user_info_from_jwt: All claims from get_jwt(): {claims} (type: {type(claims)})")

        if not isinstance(claims, dict):
            app.logger.error("get_user_info_from_jwt: Claims del JWT no es un diccionario o está vacío.")
            return None, None, {"message": "Datos de sesión inválidos: Formato de token incorrecto o token expirado/inválido."}, 401

        empresa_id_raw = claims.get('empresa_id')
        rol = claims.get('rol')

        app.logger.info(f"get_user_info_from_jwt: Extracted from claims: empresa_id_raw: {empresa_id_raw} (type: {type(empresa_id_raw)}), rol: {rol}")

        if empresa_id_raw is None:
            app.logger.error("get_user_info_from_jwt: 'empresa_id' no encontrada en los claims del JWT.")
            return None, None, {"message": "Datos de sesión inválidos: ID de empresa faltante en el token. Por favor, inicia sesión de nuevo."}, 401

        try:
            empresa_id = int(empresa_id_raw)
            app.logger.info(f"get_user_info_from_jwt: empresa_id convertida a int: {empresa_id} (type: {type(empresa_id)})")
        except (TypeError, ValueError) as e:
            app.logger.error(f"get_user_info_from_jwt: Error al convertir 'empresa_id' a entero: '{empresa_id_raw}' (type: {type(empresa_id_raw)}) - Error: {e}", exc_info=True)
            return None, None, {"message": "Datos de sesión inválidos: ID de empresa incorrecto en el token. Por favor, inicia sesión de nuevo."}, 401
        
        return empresa_id, rol, None, None
    except Exception as e:
        app.logger.error(f"get_user_info_from_jwt: Error inesperado al obtener identidad del JWT: {e}", exc_info=True)
        return None, None, {"message": "Error interno al procesar el token de sesión."}, 500

# --- Rutas de NFC Tags (Requieren autenticación JWT) ---
@app.route('/api/nfc-tags', methods=['GET'])
@jwt_required()
def get_nfc_tags():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"GET /api/nfc-tags: Intentando obtener tags para empresa_id: {empresa_id}")
        tags = NfcTag.query.filter_by(empresa_id=empresa_id).all()
        output = [{'id': tag.id, 'tag_id': tag.tag_id, 'data': tag.data, 'public_url': tag.public_url} for tag in tags]
        app.logger.info(f"GET /api/nfc-tags: Se obtuvieron {len(tags)} tags para empresa_id: {empresa_id}")
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"GET /api/nfc-tags: Error interno al obtener tags NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al obtener tags NFC.'}), 500

@app.route('/api/nfc-tags', methods=['POST'])
@jwt_required()
def add_nfc_tag():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    data = request.get_json()
    tag_id = data.get('tagId')
    tag_data = data.get('tagName') # Usar tagName para 'data' en el modelo
    public_url = data.get('publicUrl')

    try:
        app.logger.info(f"POST /api/nfc-tags: Intentando añadir tag para empresa_id: {empresa_id}, tag_id: {tag_id}")

        if not tag_id or not tag_data or not public_url:
            return jsonify({'message': 'Faltan campos obligatorios: tagId, tagName y publicUrl'}), 400
        
        new_tag = NfcTag(tag_id=tag_id, data=tag_data, public_url=public_url, empresa_id=empresa_id)
        db.session.add(new_tag)
        db.session.commit()
        app.logger.info(f"POST /api/nfc-tags: Tag {tag_id} añadido con éxito para empresa_id: {empresa_id}")
        return jsonify({'message': 'Tag NFC añadido con éxito'}), 201
    except Exception as e:
        app.logger.error(f"POST /api/nfc-tags: Error interno al añadir tag NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al añadir tag NFC.'}), 500


@app.route('/api/nfc-tags/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_nfc_tag(id):
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"DELETE /api/nfc-tags/{id}: Intentando eliminar tag para empresa_id: {empresa_id}")

        tag = NfcTag.query.filter_by(id=id, empresa_id=empresa_id).first_or_404()
        db.session.delete(tag)
        db.session.commit()
        app.logger.info(f"DELETE /api/nfc-tags/{id}: Tag {id} eliminado con éxito para empresa_id: {empresa_id}")
        return jsonify({'message': 'Tag NFC eliminado con éxito'}), 200
    except Exception as e:
        app.logger.error(f"DELETE /api/nfc-tags/{id}: Error interno al eliminar tag NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al eliminar tag NFC.'}), 500

# --- Rutas de NFC Taps (Requieren autenticación JWT) ---
@app.route('/api/nfc-taps', methods=['GET'])
@jwt_required()
def get_nfc_taps():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"GET /api/nfc-taps: Intentando obtener datos de taps para empresa_id: {empresa_id}")
        taps = NfcTap.query.filter_by(empresa_id=empresa_id).all()
        output = [
            {
                'id': tap.id,
                'tag_id': tap.tag_id,
                'timestamp': tap.timestamp.isoformat(), # Convertir datetime a string ISO
                'ip_address': tap.ip_address,
                'user_agent': tap.user_agent,
                'location_data': tap.location_data,
                'empresa_id': tap.empresa_id
            } for tap in taps
        ]
        app.logger.info(f"GET /api/nfc-taps: Se obtuvieron {len(taps)} taps para empresa_id: {empresa_id}")
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"GET /api/nfc-taps: Error interno al obtener datos de taps NFC: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al obtener datos de taps NFC.'}), 500

# **NUEVA RUTA PÚBLICA PARA MANEJAR EL TAP INICIAL Y OBTENER URL DE REDIRECCIÓN**
@app.route('/api/public/tag-info/<string:tag_id>', methods=['GET'])
def get_public_tag_info(tag_id):
    app.logger.info(f"Received public request for {request.path} with method {request.method}")
    try:
        tag = NfcTag.query.filter_by(tag_id=tag_id).first()
        if not tag:
            app.logger.warning(f"Public Tag Info: Tag ID '{tag_id}' no encontrado.")
            return jsonify({'message': 'Tag NFC no encontrado o inválido.'}), 404
        
        # Devolver solo la información necesaria para la redirección pública
        return jsonify({
            'tag_id': tag.tag_id,
            'public_url': tag.public_url,
            'empresa_id': tag.empresa_id
        }), 200
    except Exception as e:
        app.logger.error(f"Public Tag Info: Error interno al obtener información del tag '{tag_id}': {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor.'}), 500

# **NUEVA RUTA PARA REGISTRAR EVENTOS DE TAP**
@app.route('/api/tap-event', methods=['POST'])
def register_tap_event():
    app.logger.info(f"Received tap event request for {request.path} with method {request.method}")
    data = request.get_json()
    tag_id = data.get('tagId')
    ip_address = request.remote_addr # IP del cliente
    user_agent = request.headers.get('User-Agent') # User-Agent del cliente
    location_data = data.get('locationData') # Datos de geolocalización enviados desde el frontend

    if not tag_id:
        app.logger.warning("Register Tap Event: tagId no proporcionado.")
        return jsonify({'message': 'ID del tag es obligatorio.'}), 400

    try:
        # Obtener la empresa_id del tag
        nfc_tag = NfcTag.query.filter_by(tag_id=tag_id).first()
        if not nfc_tag:
            app.logger.warning(f"Register Tap Event: Tag ID '{tag_id}' no encontrado en la base de datos.")
            return jsonify({'message': 'Tag NFC no encontrado.'}), 404
        
        empresa_id = nfc_tag.empresa_id

        new_tap = NfcTap(
            tag_id=tag_id,
            ip_address=ip_address,
            user_agent=user_agent,
            location_data=location_data,
            empresa_id=empresa_id
        )
        db.session.add(new_tap)
        db.session.commit()
        app.logger.info(f"Tap Event: Tap registrado con éxito para tag '{tag_id}' de empresa '{empresa_id}'.")
        return jsonify({'message': 'Tap registrado con éxito'}), 201
    except Exception as e:
        app.logger.error(f"Tap Event: Error interno al registrar el tap para tag '{tag_id}': {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al registrar el tap.'}), 500


# --- Rutas de Administración (Requieren autenticación JWT) ---
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"GET /api/admin/users: Intentando obtener usuarios para empresa_id: {empresa_id}, rol: {rol}")

        if rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403
        
        users = User.query.filter_by(empresa_id=empresa_id).all()
        output = [{'id': user.id, 'nombre': user.nombre, 'email': user.email, 'rol': user.rol.nombre, 'empresa': user.empresa.nombre} for user in users]
        app.logger.info(f"GET /api/admin/users: Se obtuvieron {len(users)} usuarios para empresa_id: {empresa_id}")
        return jsonify(output)
    except Exception as e:
        app.logger.error(f"GET /api/admin/users: Error interno al obtener usuarios: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al obtener usuarios.'}), 500

@app.route('/api/admin/register', methods=['POST'])
@jwt_required()
def admin_register():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, admin_rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"POST /api/admin/register: Intentando registrar usuario por {admin_rol} de empresa {empresa_id}")

        if admin_rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403

        data = request.get_json()
        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        rol_id = data.get('rol_id', 2) # Por defecto, crea un 'admin' (rol_id=2)
        empresa_id_from_request = data.get('empresa_id', empresa_id) # Por defecto, la misma empresa del admin

        if not all([nombre, email, password]):
            return jsonify({'message': 'Faltan campos obligatorios'}), 400
        
        # Asegurarse de que el nuevo usuario se cree en la misma empresa del super_admin
        if empresa_id_from_request != empresa_id:
            app.logger.error(f"POST /api/admin/register: Intento de crear usuario en empresa incorrecta. Admin empresa: {empresa_id}, Solicitud empresa: {empresa_id_from_request}")
            return jsonify({'message': 'No puedes crear usuarios en otra empresa'}), 403

        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({'message': 'El usuario ya existe'}), 409

        new_user = User(nombre=nombre, email=email, rol_id=rol_id, empresa_id=empresa_id_from_user) # Corrected to use empresa_id_from_request
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        app.logger.info(f"POST /api/admin/register: Usuario {email} creado con éxito para empresa {empresa_id_from_request}")
        return jsonify({'message': 'Usuario creado con éxito'}), 201
    except Exception as e:
        app.logger.error(f"POST /api/admin/register: Error interno al registrar usuario: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al registrar usuario.'}), 500

@app.route('/api/admin/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, admin_rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"DELETE /api/admin/users/{id}: Intentando eliminar usuario por {admin_rol} de empresa {empresa_id}")

        if admin_rol != 'super_admin':
            return jsonify({'message': 'Permiso denegado'}), 403
        
        user = User.query.filter_by(id=id, empresa_id=empresa_id).first_or_404()
        db.session.delete(user)
        db.session.commit()
        app.logger.info(f"DELETE /api/admin/users/{id}: Usuario {id} eliminado con éxito para empresa {empresa_id}")
        return jsonify({'message': 'Usuario eliminado con éxito'}), 200
    except Exception as e:
        app.logger.error(f"DELETE /api/admin/users/{id}: Error interno al eliminar usuario: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al eliminar usuario.'}), 500

# Ruta para obtener el nombre de la empresa del usuario logueado
@app.route('/api/empresa', methods=['GET'])
@jwt_required()
def get_empresa_info():
    app.logger.info(f"Received request for {request.path} with method {request.method}")
    empresa_id, rol, error_message, error_code = get_user_info_from_jwt()
    if error_message:
        return jsonify(error_message), error_code

    try:
        app.logger.info(f"GET /api/empresa: Intentando obtener información de empresa para empresa_id: {empresa_id}")

        empresa = Empresa.query.get(empresa_id)
        if not empresa:
            return jsonify({'message': 'Empresa no encontrada'}), 404
        
        app.logger.info(f"GET /api/empresa: Nombre de empresa obtenido: {empresa.nombre}")
        return jsonify({'nombre': empresa.nombre}), 200
    except Exception as e:
        app.logger.error(f"GET /api/empresa: Error interno al obtener información de empresa: {e}", exc_info=True)
        return jsonify({'message': 'Error interno del servidor al obtener información de empresa.'}), 500

# **NUEVO ENDPOINT PARA RECIBIR LOGS DEL CLIENTE**
@app.route('/api/client-log', methods=['POST'])
def client_log():
    log_data = request.get_json()
    level = log_data.get('level', 'INFO').upper()
    message = log_data.get('message', 'No message provided')
    timestamp = log_data.get('timestamp', datetime.datetime.now().isoformat())
    
    # Puedes añadir más campos como user_agent, url, etc.
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
