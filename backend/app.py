from flask import Flask, request, jsonify, session, Response
from flask_cors import CORS
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from functools import wraps

import os
import uuid
import time
from bson.objectid import ObjectId
from config import Config
from utils.model_loader import ModelLoader
from database import mongo_db
from database import get_db
import traceback

app = Flask(__name__)
app.config.from_object(Config)

# ✅ FIXED: CORS configuration that supports credentials with specific origins
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# ✅ FIXED: Global error handler with credential-safe CORS headers
@app.errorhandler(Exception)
def handle_all_exceptions(e):
    """Ensures CORS headers are present even when database is down"""
    # Create error response
    if "connection" in str(e).lower() or "timeout" in str(e).lower():
        response = jsonify({
            'success': False,
            'error': 'Database connection temporarily unavailable',
            'message': 'Please check your network connection and try again in a moment'
        })
        response.status_code = 503  # Service Unavailable
    else:
        response = jsonify({
            'success': False,
            'error': 'Server error occurred',
            'message': str(e) if app.debug else 'An unexpected error occurred'
        })
        response.status_code = 500

    # ✅ FIXED: Use specific origin, not wildcard with credentials
    origin = request.headers.get('Origin')
    allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, Accept, X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

# ✅ FIXED: Connection error handler with credential-safe CORS
@app.errorhandler(ConnectionError)
def handle_connection_error(e):
    """Handle MongoDB connection failures gracefully"""
    response = jsonify({
        'success': False,
        'error': 'Database connection failed',
        'message': 'Network connectivity issue. Please try again.',
        'retry_suggested': True
    })
    response.status_code = 503
    
    # Use specific origin, not wildcard
    origin = request.headers.get('Origin')
    allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, Accept, X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

# ✅ FIXED: Preflight handler with credential-safe CORS
@app.before_request
def handle_options_request():
    if request.method == "OPTIONS":
        response = Response()
        
        # Use specific origin, not wildcard
        origin = request.headers.get('Origin')
        allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
        
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, Accept, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.status_code = 200
        return response
    
    # Make sessions permanent
    session.permanent = True

# ✅ FIXED: After-request handler with credential-safe CORS
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
    
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, Accept, X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# ✅ Session configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True

# ✅ FIXED: Use filesystem sessions instead of MongoDB
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './sessions'
app.config['SESSION_PERMANENT'] = True

# Initialize MongoDB first (keep this for your app data)
db = mongo_db

# ✅ FIXED: Initialize Session properly
os.makedirs('./sessions', exist_ok=True)
Session(app)

# ✅ FIXED: SocketIO with session management disabled to prevent conflicts
socketio = SocketIO(app, 
                    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                    manage_session=False)

# Initialize model loader with error handling
try:
    model_loader = ModelLoader()
    model_loader.load_models()
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"⚠️ Model loading failed: {str(e)}")
    model_loader = None

# ✅ ROBUST DATABASE OPERATION WRAPPER
def safe_db_operation(operation, *args, **kwargs):
    """Execute database operations with automatic retry and error handling"""
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            if db.client is None:  # ✅ Fixed PyMongo 4.x compatibility
                raise ConnectionError("MongoDB client not initialized")
            
            # Test connection
            db.client.admin.command('ping')
            
            # Execute operation
            return operation(*args, **kwargs)
            
        except Exception as e:
            print(f"🔄 DB operation attempt {attempt + 1} failed: {str(e)}")
            
            if attempt == max_retries - 1:
                # Last attempt - raise ConnectionError for our error handler
                raise ConnectionError(f"Database unavailable after {max_retries} attempts: {str(e)}")
            
            time.sleep(1)  # Wait before retry

# Helper functions
def serialize_doc(doc):
    if doc:
        doc['id'] = str(doc['_id'])
        doc.pop('_id', None)
        return doc
    return None

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# ✅ CONSISTENT: All routes without /api/ prefix
@app.route('/health/network', methods=['GET'])
def network_health():
    """Check both database and application health"""
    try:
        if db.client is None:  # ✅ Fixed PyMongo 4.x compatibility
            return jsonify({
                'status': 'disconnected',
                'database': 'not_initialized',
                'application': 'running',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), 503
        
        # Test MongoDB connection
        db.client.admin.command('ping')
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'application': 'running',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'status': 'degraded',
            'database': 'connection_failed',
            'application': 'running',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 503

@app.route('/test-mongodb', methods=['GET'])
def test_mongodb():
    try:
        if db.client is not None:  # ✅ Fixed PyMongo 4.x compatibility
            db.client.admin.command('ping')
            user_count = db.users.count_documents({}) if db.users is not None else 0
            return jsonify({
                'success': True, 
                'message': 'MongoDB connection working',
                'user_count': user_count,
                'connection_status': 'Connected'
            })
        else:
            return jsonify({
                'success': False, 
                'error': 'MongoDB not initialized',
                'message': 'MongoDB connection failed'
            })
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'message': 'MongoDB connection failed'
        })

@app.route('/auth/check-session', methods=['GET'])
def check_session_auth():
    """Check if current session is valid - matches /auth/login structure"""
    try:
        print(f"🔍 Checking session: {dict(session)}")  # Debug log
        
        if 'user_id' in session and 'user_type' in session:
            return jsonify({
                'success': True,
                'user_id': session['user_id'],
                'user_type': session['user_type'],
                'authenticated': True,
                'session_expires_in_hours': 168  # 7 days
            })
        
        return jsonify({
            'success': False, 
            'error': 'No valid session',
            'authenticated': False
        })
    
    except Exception as e:
        print(f"Session check error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'authenticated': False})

@app.route('/debug/session-health', methods=['GET'])
def session_health():
    try:
        mongodb_status = 'connected'
        try:
            if db.client is not None:  # ✅ Fixed PyMongo 4.x compatibility
                db.client.admin.command('ping')
            else:
                mongodb_status = 'not_initialized'
        except:
            mongodb_status = 'failed'
            
        return jsonify({
            'session_data': dict(session),
            'session_permanent': session.permanent,
            'user_id': session.get('user_id'),
            'user_type': session.get('user_type'),
            'is_authenticated': 'user_id' in session,
            'session_cookie_age': str(app.permanent_session_lifetime),
            'current_time': datetime.now(timezone.utc).isoformat(),
            'login_timestamp': session.get('login_timestamp'),
            'mongodb_status': mongodb_status
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'session_broken': True,
            'current_time': datetime.now(timezone.utc).isoformat()
        })

@app.route('/debug/connection-status', methods=['GET'])
def check_connection_status():
    try:
        if db.client is None:  # ✅ Fixed PyMongo 4.x compatibility
            return jsonify({
                'error': 'MongoDB client not initialized',
                'mongodb': 'Not Initialized',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), 500
            
        # Test MongoDB connection
        db.client.admin.command('ping')
        
        # ✅ Fixed PyMongo 4.x compatibility
        test_user = db.users.find_one({}, {'_id': 1}) if db.users is not None else None
        
        return jsonify({
            'mongodb': 'Connected',
            'user_collection': 'Accessible' if test_user is not None else 'Empty',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'mongodb': 'Connection Failed',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/debug/session', methods=['GET'])
def debug_session():
    return jsonify({
        'session_data': dict(session),
        'user_id': session.get('user_id'),
        'user_type': session.get('user_type'),
        'is_authenticated': 'user_id' in session
    })

# ✅ AUTHENTICATION ROUTES
@app.route('/auth/register', methods=['POST'])
def handle_user_registration():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'})
            
        user_type = data.get('user_type')
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'})
        
        # ✅ Fixed PyMongo 4.x compatibility
        if db.client is None or db.users is None:
            return jsonify({'success': False, 'error': 'Database not available'})
        
        # Use our safe database operation
        def find_existing_user():
            return db.users.find_one({'email': data['email']})
        
        existing_user = safe_db_operation(find_existing_user)
        
        if existing_user:
            return jsonify({'success': False, 'error': 'User already exists'})
        
        # Create user document
        user_data = {
            'email': data['email'],
            'password_hash': generate_password_hash(data['password']),
            'user_type': user_type,
            'name': data['name'],
            'created_at': datetime.now(timezone.utc),
            'status': 'active'
        }
        
        # Add type-specific fields
        if user_type == 'patient':
            if data.get('age'):
                user_data['age'] = int(data['age'])
            if data.get('gender'):
                user_data['gender'] = data['gender']
            if data.get('phone'):
                user_data['phone'] = data['phone']
                
        elif user_type == 'doctor':
            if data.get('specialization'):
                user_data['specialization'] = data['specialization']
            if data.get('license_number'):
                user_data['license_number'] = data['license_number']
            if data.get('experience'):
                user_data['experience'] = int(data['experience'])
            user_data['verified'] = True
        
        # Insert user
        def insert_user():
            return db.users.insert_one(user_data)
        
        result = safe_db_operation(insert_user)
        user_id = str(result.inserted_id)
        
        return jsonify({
            'success': True, 
            'user_id': user_id,
            'user': {
                'id': user_id,
                'name': user_data['name'],
                'email': user_data['email'],
                'user_type': user_type
            }
        })
    
    except ConnectionError as e:
        # This will be caught by our error handler
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': f'Registration failed: {str(e)}'})

@app.route('/auth/login', methods=['POST'])
def login():    
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400

        def find_user():
            return db.users.find_one({'email': email})

        user = safe_db_operation(find_user)

        if user and check_password_hash(user.get('password_hash'), password):
            # ✅ SESSION FIX - These are the key lines
            session.clear()
            session['user_id'] = str(user['_id'])
            session['user_type'] = user.get('user_type')
            session['login_timestamp'] = datetime.now(timezone.utc).isoformat()
            session.permanent = True      # ✅ Make session permanent
            session.modified = True       # ✅ Force Flask to save session
            
            print(f"✅ Session created: {dict(session)}")  # ✅ Debug log
            
            return jsonify({
                'success': True,
                'user': {
                    'id': str(user['_id']),
                    'name': user.get('name'),
                    'email': user.get('email'),
                    'user_type': user.get('user_type')
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': f'Login failed: {str(e)}'}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

# ✅ PATIENT ROUTES
@app.route('/patient/predict/<disease>', methods=['POST'])
def patient_predict(disease):
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        if not model_loader:
            return jsonify({'success': False, 'error': 'Prediction models not available'})
            
        data = request.json
        if not data or 'features' not in data:
            return jsonify({'success': False, 'error': 'Features are required'})
            
        features = data['features']
        
        # Get prediction from model
        result = model_loader.predict(disease, features)
        
        # Create prediction record
        prediction_record = {
            'patient_id': session['user_id'],
            'disease': disease,
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'risk_level': result['risk_level'],
            'features': features,
            'feature_names': model_loader.get_feature_names(disease),
            'created_at': datetime.now(timezone.utc),
            'status': 'pending_review',
            'doctor_review': None
        }
        
        # ✅ Fixed PyMongo 4.x compatibility
        if db.predictions is not None:
            def insert_prediction():
                return db.predictions.insert_one(prediction_record)
            
            try:
                result_db = safe_db_operation(insert_prediction)
                prediction_record['id'] = str(result_db.inserted_id)
            except ConnectionError:
                # Still return prediction even if DB save fails
                print("⚠️ Could not save prediction to database")
        
        return jsonify({
            'success': True,
            'prediction': serialize_doc(prediction_record)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    
#PATIENT STATS
@app.route('/patient/stats', methods=['GET'])
@login_required
def get_patient_stats():
    """Get patient statistics"""
    try:
        user_id = session['user_id']
        
        # Count predictions made by this patient
        # You'll need to implement a predictions collection/table
        prediction_count = db.predictions.count_documents({'patient_id': user_id}) if hasattr(db, 'predictions') else 0
        
        # Count consultations
        consultation_count = db.consultations.count_documents({'patient_id': user_id}) if hasattr(db, 'consultations') else 0
        
        # Get last checkup date
        last_prediction = db.predictions.find_one(
            {'patient_id': user_id}, 
            sort=[('timestamp', -1)]
        ) if hasattr(db, 'predictions') else None
        
        last_checkup = 'Never'
        if last_prediction:
            from datetime import datetime
            last_date = last_prediction.get('timestamp', datetime.now())
            last_checkup = last_date.strftime('%Y-%m-%d')
        
        return jsonify({
            'success': True,
            'stats': {
                'totalPredictions': prediction_count,
                'consultations': consultation_count,
                'lastCheckup': last_checkup,
                'totalModels': 5,  # Your 5 AI models
                'favoriteModel': 'Anemia Detection'  # Most used model
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting patient stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'stats': {
                'totalPredictions': 0,
                'consultations': 0,
                'lastCheckup': 'Never'
            }
        })
    

@app.route('/patient/history', methods=['GET'])
def get_patient_history():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.predictions is None:
            return jsonify({'success': True, 'predictions': []})
            
        def get_predictions():
            return list(db.predictions.find(
                {'patient_id': session['user_id']}
            ).sort('created_at', -1))
        
        predictions = safe_db_operation(get_predictions)
        
        # Get doctor information for reviewed cases
        for pred in predictions:
            if pred.get('doctor_review') and pred.get('reviewed_by') and db.users is not None:  # ✅ Fixed
                try:
                    def get_doctor():
                        return db.users.find_one({'_id': ObjectId(pred['reviewed_by'])})
                    
                    doctor = safe_db_operation(get_doctor)
                    if doctor:
                        pred['doctor_name'] = doctor['name']
                        pred['doctor_specialization'] = doctor.get('specialization')
                except ConnectionError:
                    # Continue without doctor info if connection fails
                    pass
        
        return jsonify({'success': True, 'predictions': serialize_docs(predictions)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/patient/book-consultation', methods=['POST'])
def book_consultation():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.consultations is None:
            return jsonify({'success': False, 'error': 'Database not available'})
            
        data = request.json
        if not data or not data.get('doctor_id'):
            return jsonify({'success': False, 'error': 'Doctor ID is required'})
            
        chat_room_id = str(uuid.uuid4())
        
        consultation = {
            'patient_id': session['user_id'],
            'doctor_id': data['doctor_id'],
            'prediction_id': data.get('prediction_id'),
            'requested_date': data.get('requested_date', datetime.now(timezone.utc).isoformat()),
            'message': data.get('message', ''),
            'status': 'pending',
            'created_at': datetime.now(timezone.utc),
            'chat_room_id': chat_room_id,
            'video_call_enabled': True,
            'file_sharing_enabled': True
        }
        
        def insert_consultation():
            return db.consultations.insert_one(consultation)
        
        result = safe_db_operation(insert_consultation)
        consultation_id = str(result.inserted_id)
        
        # Create chat room
        chat_room = {
            'consultation_id': consultation_id,
            'room_id': chat_room_id,
            'participants': [session['user_id'], data['doctor_id']],
            'created_at': datetime.now(timezone.utc),
            'messages': [],
            'active': True
        }
        
        # ✅ Fixed PyMongo 4.x compatibility
        if db.db is not None:
            try:
                def insert_chat_room():
                    return db.db.chat_rooms.insert_one(chat_room)
                
                safe_db_operation(insert_chat_room)
            except ConnectionError:
                print("⚠️ Chat room creation failed, but consultation was booked")
        
        return jsonify({
            'success': True, 
            'consultation_id': consultation_id,
            'chat_room_id': chat_room_id
        })
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/patient/consultations', methods=['GET'])
def get_patient_consultations():
    if 'user_id' not in session or session.get('user_type') != 'patient':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.consultations is None:
            return jsonify({'success': True, 'consultations': []})
            
        def get_consultations():
            return list(db.consultations.find({
                'patient_id': session['user_id']
            }).sort('created_at', -1))
        
        consultations = safe_db_operation(get_consultations)
        
        # Get doctor information for each consultation
        for consultation in consultations:
            if db.users is not None:  # ✅ Fixed
                try:
                    def get_doctor():
                        return db.users.find_one({'_id': ObjectId(consultation['doctor_id'])})
                    
                    doctor = safe_db_operation(get_doctor)
                    if doctor:
                        consultation['doctor_name'] = doctor['name']
                        consultation['doctor_email'] = doctor['email']
                        consultation['doctor_specialization'] = doctor.get('specialization', 'General')
                except ConnectionError:
                    pass
        
        return jsonify({'success': True, 'consultations': serialize_docs(consultations)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ✅ CHAT ROUTES
@app.route('/chat/send-message', methods=['POST'])
def send_message():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.db is None:
            return jsonify({'success': False, 'error': 'Database not available'})
            
        data = request.json
        if not data or not data.get('chat_room_id') or not data.get('content'):
            return jsonify({'success': False, 'error': 'Chat room ID and content are required'})
            
        message_id = str(uuid.uuid4())
        
        message = {
            'id': message_id,
            'chat_room_id': data['chat_room_id'],
            'sender_id': session['user_id'],
            'sender_type': session['user_type'],
            'message_type': data.get('message_type', 'text'),
            'content': data['content'],
            'file_url': data.get('file_url'),
            'timestamp': datetime.now(timezone.utc),
            'read_by': [session['user_id']],
            'edited': False
        }
        
        def insert_message():
            return db.db.messages.insert_one(message)
        
        def update_chat_room():
            return db.db.chat_rooms.update_one(
                {'room_id': data['chat_room_id']},
                {
                    '$push': {'messages': message_id},
                    '$set': {'last_message_at': datetime.now(timezone.utc)}
                }
            )
        
        safe_db_operation(insert_message)
        safe_db_operation(update_chat_room)
        
        # Emit to real-time listeners
        socketio.emit('new_message', serialize_doc(message), room=data['chat_room_id'])
        
        return jsonify({'success': True, 'message_id': message_id})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/chat/get-messages/<room_id>', methods=['GET'])
def get_chat_messages(room_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.db is None:
            return jsonify({'success': False, 'error': 'Database not available'})
            
        def get_chat_room():
            return db.db.chat_rooms.find_one({'room_id': room_id})
        
        def get_messages():
            return list(db.db.messages.find(
                {'chat_room_id': room_id}
            ).sort('timestamp', 1))
        
        def mark_messages_read():
            return db.db.messages.update_many(
                {'chat_room_id': room_id, 'sender_id': {'$ne': session['user_id']}},
                {'$addToSet': {'read_by': session['user_id']}}
            )
        
        # Verify user has access to this chat room
        chat_room = safe_db_operation(get_chat_room)
        if not chat_room or session['user_id'] not in chat_room['participants']:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get messages for this chat room
        messages = safe_db_operation(get_messages)
        
        # Mark messages as read
        safe_db_operation(mark_messages_read)
        
        return jsonify({'success': True, 'messages': serialize_docs(messages)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/chat/upload-file', methods=['POST'])
def upload_chat_file():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'})
        
        file = request.files['file']
        room_id = request.form.get('room_id')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        if not room_id:
            return jsonify({'success': False, 'error': 'Room ID is required'})
        
        # Create uploads directory if it doesn't exist
        upload_dir = 'uploads/chat'
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        file_info = {
            'id': str(uuid.uuid4()),
            'filename': file.filename,
            'file_path': file_path,
            'file_url': f"/uploads/chat/{filename}",
            'file_size': os.path.getsize(file_path),
            'uploaded_by': session['user_id'],
            'room_id': room_id,
            'uploaded_at': datetime.now(timezone.utc)
        }
        
        # ✅ Fixed PyMongo 4.x compatibility
        if db.db is not None:
            try:
                def insert_file_info():
                    return db.db.chat_files.insert_one(file_info)
                
                safe_db_operation(insert_file_info)
            except ConnectionError:
                print("⚠️ File info storage failed, but file was uploaded")
        
        return jsonify({
            'success': True,
            'file_url': file_info['file_url'],
            'filename': file.filename
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/video-call/start', methods=['POST'])
def start_video_call():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        if not data or not data.get('consultation_id') or not data.get('room_id'):
            return jsonify({'success': False, 'error': 'Consultation ID and room ID are required'})
            
        call_id = str(uuid.uuid4())
        
        call_session = {
            'id': call_id,
            'consultation_id': data['consultation_id'],
            'room_id': data['room_id'],
            'initiated_by': session['user_id'],
            'participants': [],
            'start_time': datetime.now(timezone.utc),
            'status': 'calling',
            'call_type': data.get('call_type', 'video')
        }
        
        # ✅ Fixed PyMongo 4.x compatibility
        if db.db is not None:
            try:
                def insert_call_session():
                    return db.db.video_calls.insert_one(call_session)
                
                safe_db_operation(insert_call_session)
            except ConnectionError:
                print("⚠️ Video call session storage failed")
        
        # Notify other participant
        socketio.emit('incoming_call', {
            'call_id': call_id,
            'caller_id': session['user_id'],
            'caller_type': session['user_type'],
            'call_type': call_session['call_type']
        }, room=data['room_id'])
        
        return jsonify({'success': True, 'call_id': call_id})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ✅ DOCTOR ROUTES
@app.route('/doctor/pending-cases', methods=['GET'])
def get_pending_cases():
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.predictions is None:
            return jsonify({'success': True, 'cases': []})
            
        def get_predictions():
            return list(db.predictions.find(
                {'status': 'pending_review'}
            ).sort('created_at', -1))
        
        predictions = safe_db_operation(get_predictions)
        
        # Get patient information for each case
        for pred in predictions:
            if db.users is not None:  # ✅ Fixed
                try:
                    def get_patient():
                        return db.users.find_one({'_id': ObjectId(pred['patient_id'])})
                    
                    patient = safe_db_operation(get_patient)
                    if patient:
                        pred['patient_name'] = patient['name']
                        pred['patient_age'] = patient.get('age')
                        pred['patient_gender'] = patient.get('gender')
                except ConnectionError:
                    pass
        
        return jsonify({'success': True, 'cases': serialize_docs(predictions)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/doctor/review-case/<case_id>', methods=['POST'])
def review_case(case_id):
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.predictions is None:
            return jsonify({'success': False, 'error': 'Database not available'})
            
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'Review data is required'})
        
        update_data = {
            'status': 'reviewed',
            'reviewed_by': session['user_id'],
            'doctor_review': {
                'diagnosis': data.get('diagnosis', ''),
                'severity': data.get('severity', ''),
                'recommendations': data.get('recommendations', ''),
                'follow_up_required': data.get('follow_up_required', False),
                'medications': data.get('medications', []),
                'lifestyle_changes': data.get('lifestyle_changes', []),
                'reviewed_at': datetime.now(timezone.utc)
            }
        }
        
        def update_prediction():
            return db.predictions.update_one(
                {'_id': ObjectId(case_id)}, 
                {'$set': update_data}
            )
        
        safe_db_operation(update_prediction)
        return jsonify({'success': True})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/doctor/consultations', methods=['GET'])
def get_doctor_consultations():
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.consultations is None:
            return jsonify({'success': True, 'consultations': []})
            
        def get_consultations():
            return list(db.consultations.find(
                {'doctor_id': session['user_id']}
            ).sort('created_at', -1))
        
        consultations = safe_db_operation(get_consultations)
        
        # Get patient information for each consultation
        for consultation in consultations:
            if db.users is not None:  # ✅ Fixed
                try:
                    def get_patient():
                        return db.users.find_one({'_id': ObjectId(consultation['patient_id'])})
                    
                    patient = safe_db_operation(get_patient)
                    if patient:
                        consultation['patient_name'] = patient['name']
                        consultation['patient_email'] = patient['email']
                except ConnectionError:
                    pass
        
        return jsonify({'success': True, 'consultations': serialize_docs(consultations)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/doctor/update-consultation/<consultation_id>', methods=['POST'])
def update_consultation_status(consultation_id):
    if 'user_id' not in session or session.get('user_type') != 'doctor':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.consultations is None:
            return jsonify({'success': False, 'error': 'Database not available'})
            
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'Status data is required'})
            
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'success': False, 'error': 'Status is required'})
        
        def update_consultation():
            return db.consultations.update_one(
                {'_id': ObjectId(consultation_id), 'doctor_id': session['user_id']},
                {'$set': {'status': new_status, 'updated_at': datetime.now(timezone.utc)}}
            )
        
        result = safe_db_operation(update_consultation)
        
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': f'Consultation status updated to {new_status}'})
        else:
            return jsonify({'success': False, 'error': 'Consultation not found or unauthorized'})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ✅ GENERAL ROUTES
@app.route('/doctors/available', methods=['GET'])
def get_available_doctors():
    try:
        # ✅ Fixed PyMongo 4.x compatibility
        if db.users is None:
            return jsonify({'success': True, 'doctors': []})
            
        def get_doctors():
            return list(db.users.find({
                'user_type': 'doctor',
                'verified': True,
                'status': 'active'
            }, {
                'name': 1, 
                'specialization': 1, 
                'experience': 1, 
                'phone': 1
            }))
        
        doctors = safe_db_operation(get_doctors)
        return jsonify({'success': True, 'doctors': serialize_docs(doctors)})
    
    except ConnectionError as e:
        raise e
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/diseases/info', methods=['GET'])
def get_disease_info():
    disease_info = {
        'anemia': {
            'name': 'Anemia Detection',
            'description': 'Clinical-grade anemia detection using blood parameters (100% accuracy)',
            'fields': [
                {'name': 'gender', 'label': 'Gender', 'type': 'select', 'options': [{'value': 0, 'label': 'Female'}, {'value': 1, 'label': 'Male'}]},
                {'name': 'hemoglobin', 'label': 'Hemoglobin (g/dL)', 'type': 'number', 'min': 4, 'max': 20, 'step': 0.1, 'required': True},
                {'name': 'mch', 'label': 'MCH (pg)', 'type': 'number', 'min': 15, 'max': 50, 'step': 0.1, 'required': True},
                {'name': 'mchc', 'label': 'MCHC (g/dL)', 'type': 'number', 'min': 25, 'max': 40, 'step': 0.1, 'required': True},
                {'name': 'mcv', 'label': 'MCV (fL)', 'type': 'number', 'min': 60, 'max': 120, 'step': 0.1, 'required': True}
            ]
        },
        'diabetes': {
            'name': 'Diabetes Prediction',
            'description': 'Type 2 diabetes risk assessment using clinical indicators',
            'fields': [
                {'name': 'pregnancies', 'label': 'Pregnancies', 'type': 'number', 'min': 0, 'max': 20, 'step': 1},
                {'name': 'glucose', 'label': 'Glucose Level (mg/dL)', 'type': 'number', 'min': 50, 'max': 300, 'step': 1, 'required': True},
                {'name': 'bloodpressure', 'label': 'Blood Pressure (mmHg)', 'type': 'number', 'min': 60, 'max': 200, 'step': 1, 'required': True},
                {'name': 'skinthickness', 'label': 'Skin Thickness (mm)', 'type': 'number', 'min': 0, 'max': 100, 'step': 1},
                {'name': 'insulin', 'label': 'Insulin (mu U/ml)', 'type': 'number', 'min': 0, 'max': 1000, 'step': 1},
                {'name': 'bmi', 'label': 'BMI', 'type': 'number', 'min': 10, 'max': 60, 'step': 0.1, 'required': True},
                {'name': 'diabetespedigreefunction', 'label': 'Diabetes Pedigree Function', 'type': 'number', 'min': 0, 'max': 3, 'step': 0.001},
                {'name': 'age', 'label': 'Age (years)', 'type': 'number', 'min': 0, 'max': 120, 'step': 1, 'required': True}
            ]
        },
        'heart_disease': {
            'name': 'Heart Disease Prediction',
            'description': 'Cardiovascular disease risk assessment using clinical parameters',
            'fields': [
                {'name': 'age', 'label': 'Age (years)', 'type': 'number', 'min': 20, 'max': 120, 'step': 1, 'required': True},
                {'name': 'sex', 'label': 'Sex', 'type': 'select', 'options': [{'value': 0, 'label': 'Female'}, {'value': 1, 'label': 'Male'}], 'required': True},
                {'name': 'cp', 'label': 'Chest Pain Type', 'type': 'select', 'options': [{'value': 0, 'label': 'Typical Angina'}, {'value': 1, 'label': 'Atypical Angina'}, {'value': 2, 'label': 'Non-anginal Pain'}, {'value': 3, 'label': 'Asymptomatic'}], 'required': True},
                {'name': 'trestbps', 'label': 'Resting Blood Pressure (mmHg)', 'type': 'number', 'min': 80, 'max': 200, 'step': 1, 'required': True},
                {'name': 'chol', 'label': 'Cholesterol (mg/dL)', 'type': 'number', 'min': 100, 'max': 600, 'step': 1, 'required': True},
                {'name': 'fbs', 'label': 'Fasting Blood Sugar > 120 mg/dl', 'type': 'select', 'options': [{'value': 0, 'label': 'No'}, {'value': 1, 'label': 'Yes'}]},
                {'name': 'restecg', 'label': 'Resting ECG', 'type': 'select', 'options': [{'value': 0, 'label': 'Normal'}, {'value': 1, 'label': 'ST-T Wave Abnormality'}, {'value': 2, 'label': 'Left Ventricular Hypertrophy'}]},
                {'name': 'thalach', 'label': 'Max Heart Rate Achieved', 'type': 'number', 'min': 60, 'max': 220, 'step': 1, 'required': True},
                {'name': 'exang', 'label': 'Exercise Induced Angina', 'type': 'select', 'options': [{'value': 0, 'label': 'No'}, {'value': 1, 'label': 'Yes'}]},
                {'name': 'oldpeak', 'label': 'ST Depression', 'type': 'number', 'min': 0, 'max': 10, 'step': 0.1},
                {'name': 'slope', 'label': 'Slope of Peak Exercise ST', 'type': 'select', 'options': [{'value': 0, 'label': 'Upsloping'}, {'value': 1, 'label': 'Flat'}, {'value': 2, 'label': 'Downsloping'}]},
                {'name': 'ca', 'label': 'Number of Major Vessels (0-3)', 'type': 'select', 'options': [{'value': 0, 'label': '0'}, {'value': 1, 'label': '1'}, {'value': 2, 'label': '2'}, {'value': 3, 'label': '3'}]},
                {'name': 'thal', 'label': 'Thalassemia', 'type': 'select', 'options': [{'value': 1, 'label': 'Normal'}, {'value': 2, 'label': 'Fixed Defect'}, {'value': 3, 'label': 'Reversible Defect'}]}
            ]
        },
        'chronic': {
            'name': 'Chronic Disease (Lung Cancer)',
            'description': 'Chronic disease risk assessment focusing on lung cancer indicators',
            'fields': [
                {'name': 'gender', 'label': 'Gender', 'type': 'select', 'options': [{'value': 0, 'label': 'Female'}, {'value': 1, 'label': 'Male'}], 'required': True},
                {'name': 'age', 'label': 'Age (years)', 'type': 'number', 'min': 18, 'max': 100, 'step': 1, 'required': True},
                {'name': 'smoking', 'label': 'Smoking', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}], 'required': True},
                {'name': 'yellow_fingers', 'label': 'Yellow Fingers', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'anxiety', 'label': 'Anxiety', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'peer_pressure', 'label': 'Peer Pressure', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'chronic_disease', 'label': 'Existing Chronic Disease', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'fatigue', 'label': 'Fatigue', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'allergy', 'label': 'Allergy', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'wheezing', 'label': 'Wheezing', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'alcohol_consuming', 'label': 'Alcohol Consuming', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'coughing', 'label': 'Coughing', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'shortness_of_breath', 'label': 'Shortness of Breath', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'swallowing_difficulty', 'label': 'Swallowing Difficulty', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]},
                {'name': 'chest_pain', 'label': 'Chest Pain', 'type': 'select', 'options': [{'value': 1, 'label': 'No'}, {'value': 2, 'label': 'Yes'}]}
            ]
        },
        'malaria': {
            'name': 'Malaria Detection',
            'description': 'AI-powered malaria detection from blood cell images (99.9% confidence)',
            'fields': [
                {'name': 'image', 'label': 'Blood Cell Image', 'type': 'file', 'accept': 'image/*', 'required': True}
            ],
            'input_type': 'image',
            'image_size': '224x224'
        }
    }
    
    return jsonify({'success': True, 'diseases': disease_info})

#model load checker
@app.route('/models/status', methods=['GET'])
def get_models_status():
    """Get status of all loaded AI models"""
    try:
        if not model_loader:
            return jsonify({
                'success': False,
                'error': 'Model loader not initialized',
                'models_loaded': 0
            })
        
        status = model_loader.get_model_status()
        summary = model_loader.get_loaded_models_summary()
        
        return jsonify({
            'success': True,
            'summary': summary,
            'detailed_status': status,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'models_loaded': len(model_loader.models) if model_loader else 0
        })
# SocketIO events for real-time communication
@socketio.on('join_chat_room')
def handle_join_room(data):
    room_id = data['room_id']
    join_room(room_id)
    emit('user_joined', {'user_id': session.get('user_id')}, room=room_id)

@socketio.on('leave_chat_room')
def handle_leave_room(data):
    room_id = data['room_id']
    leave_room(room_id)
    emit('user_left', {'user_id': session.get('user_id')}, room=room_id)

@socketio.on('typing')
def handle_typing(data):
    emit('user_typing', {
        'user_id': session.get('user_id'),
        'user_type': session.get('user_type'),
        'typing': data['typing']
    }, room=data['room_id'], include_self=False)

if __name__ == '__main__':
    print("🚀 Starting Medical Diagnosis Flask Server...")
    print("🔧 Network outage protection enabled!")
    
    try:
        if db.client is not None:  # ✅ Fixed PyMongo 4.x compatibility
            db.client.admin.command('ping')
            print("✅ MongoDB connection successful!")
        else:
            print("⚠️ MongoDB not connected - app will handle gracefully")
    except Exception as e:
        print(f"⚠️ MongoDB connection issue: {str(e)}")
        print("✅ App starting anyway with network resilience")
        
    print("🌐 Server starting on http://localhost:5000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
