import os
import math
import mimetypes
from io import BytesIO
from collections import Counter
from datetime import datetime, timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, jwt_required
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from sqlalchemy.dialects.mysql import LONGBLOB
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ON_VERCEL = bool(os.getenv("VERCEL"))
# Vercel's filesystem is read-only except /tmp
WRITABLE_DIR = "/tmp" if ON_VERCEL else BASE_DIR
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(WRITABLE_DIR, "uploads"))
FRONTEND_DIST = os.path.join(BASE_DIR, "..", "frontend", "dist")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "citizen-connect-secret")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "citizen-connect-jwt")
db_url = (os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
          or "sqlite:///" + os.path.join(WRITABLE_DIR, "citizen_connect.db"))
# Render/Heroku/Railway give "postgres://" -- force the installed psycopg2 driver
for prefix in ("postgres://", "postgresql://"):
    if db_url.startswith(prefix):
        db_url = "postgresql+psycopg2://" + db_url[len(prefix):]
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=int(os.getenv("JWT_HOURS", "24")))
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# Vercel rejects request bodies over 4.5 MB
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})

SEED_DEMO = os.getenv("SEED_DEMO", "true").lower() != "false"
PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"}
STATUSES = {"PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"}
OPEN_STATUSES = {"PENDING", "ASSIGNED", "IN_PROGRESS"}
ROLES = {"CITIZEN", "EMPLOYEE", "ADMIN"}
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "webm"}
# Departments, grouped like the AP PGRS (Meekosam) portal. Each issue type has a target
# resolution time in days (PGRS SLAs range from 1 to 90 days depending on the subject).
D = lambda key, name, icon, group, issues: {"key": key, "name": name, "icon": icon, "group": group, "issues": issues}
I = lambda name, icon, sla: {"name": name, "icon": icon, "sla": sla}
DEPARTMENTS = [
    D("REVENUE", "Revenue", "📜", "Land & Revenue", [
        I("Land records correction (Webland / 1-B)", "📝", 30), I("Pattadar passbook", "📗", 30),
        I("Land mutation", "🔁", 30), I("Land encroachment", "🚧", 30), I("Land survey / boundary dispute", "📐", 45),
        I("Income / caste / residence certificate", "📄", 15), I("House site patta", "🏘️", 60)]),
    D("REGISTRATION", "Registration & Stamps", "🏛️", "Land & Revenue", [
        I("Property registration", "🖋️", 15), I("Encumbrance certificate", "📑", 7), I("Marriage registration", "💍", 15)]),
    D("ROADS", "Roads & Buildings", "🛣️", "Municipal services", [
        I("Pothole", "🕳️", 7), I("Damaged road", "🚧", 15), I("Bridge / culvert damage", "🌉", 15)]),
    D("SANITATION", "Sanitation", "🧹", "Municipal services", [
        I("Garbage", "🗑️", 2), I("Road Cleaning", "🧹", 3), I("Public toilet", "🚻", 5), I("Stray animals", "🐕", 5)]),
    D("LIGHTING", "Street Lighting", "💡", "Municipal services", [I("Street Light", "💡", 3)]),
    D("WATER", "Water Supply", "🚰", "Municipal services", [
        I("Water", "🚰", 2), I("Pipeline leakage", "💦", 3), I("Contaminated water", "⚠️", 1)]),
    D("DRAINAGE", "Drainage & Sewerage", "🌊", "Municipal services", [I("Drainage", "🌊", 5), I("Blocked sewer", "🚽", 3)]),
    D("ELECTRICAL", "Electricity (APSPDCL)", "⚡", "Municipal services", [
        I("Electricity", "⚡", 2), I("Transformer fault", "🔌", 1), I("Electricity bill", "🧾", 15), I("New connection", "🔋", 30)]),
    D("PANCHAYAT", "Panchayat Raj & Rural Development", "🏡", "Rural development", [
        I("Village roads", "🛤️", 30), I("Village sanitation", "🧺", 7), I("MGNREGS wages", "👷", 15), I("Gram Panchayat services", "🏡", 15)]),
    D("IRRIGATION", "Water Resources (Irrigation)", "💧", "Rural development", [
        I("Canal / irrigation water", "💧", 15), I("Tank encroachment", "🏞️", 30)]),
    D("AGRICULTURE", "Agriculture", "🚜", "Rural development", [
        I("Crop loss compensation", "🌾", 30), I("Seeds & fertilisers", "🌱", 7), I("Farmer schemes", "🚜", 30)]),
    D("CIVIL_SUPPLIES", "Civil Supplies", "🍚", "Welfare", [
        I("Rice card", "💳", 30), I("Ration not received", "🍚", 7), I("Fair price shop complaint", "🏪", 7)]),
    D("WELFARE", "Social Welfare & Pensions", "🤝", "Welfare", [
        I("Pension", "👵", 30), I("Welfare scheme benefit", "🎁", 30), I("Differently abled services", "♿", 30)]),
    D("HOUSING", "Housing", "🏠", "Welfare", [I("Housing scheme", "🏠", 60), I("House construction bill", "🧱", 30)]),
    D("WOMEN_CHILD", "Women & Child Welfare", "👩‍👧", "Welfare", [I("Anganwadi services", "🧒", 15), I("Child welfare", "👶", 15)]),
    D("HEALTH", "Health & Family Welfare", "🏥", "Health & education", [
        I("Hospital services", "🏥", 7), I("Aarogyasri", "💊", 15), I("Mosquito / fogging", "🦟", 5)]),
    D("EDUCATION", "School Education", "🎓", "Health & education", [
        I("School facilities", "🏫", 15), I("Teacher absence", "👩‍🏫", 7), I("Scholarship", "🎓", 30)]),
    D("POLICE", "Police", "👮", "Public safety", [
        I("Harassment / threat", "🚨", 3), I("Theft / lost property", "👛", 7), I("Traffic / parking", "🚦", 7),
        I("Noise nuisance", "🔊", 3), I("Cyber fraud", "💻", 7)]),
    D("TRANSPORT", "Transport", "🚌", "Public safety", [I("Bus service", "🚌", 15), I("Licence / RC", "🪪", 15)]),
    D("FOREST", "Forest", "🌳", "Public safety", [I("Illegal tree felling", "🪓", 15), I("Wild animal", "🐘", 3)]),
    D("GENERAL", "General Administration", "🏢", "Other", [I("Other", "📋", 7)]),
]
for d in DEPARTMENTS:  # plain lists kept for older screens
    d["categories"] = [i["name"] for i in d["issues"]]
DEPT_BY_KEY = {d["key"]: d for d in DEPARTMENTS}
CATEGORY_DEPT = {i["name"]: d["key"] for d in DEPARTMENTS for i in d["issues"]}
SLA_DAYS = {i["name"]: i["sla"] for d in DEPARTMENTS for i in d["issues"]}
PRIORITY_CAP_DAYS = {"URGENT": 1, "HIGH": 3}
MAX_REOPENS = 2  # as in PGRS: 1st reopen goes to the district officer, 2nd to the head of department
ESCALATION = {1: "District Officer", 2: "Head of Department"}


def dept_for(category):
    return CATEGORY_DEPT.get(category, "GENERAL")


def dept_name(key):
    return DEPT_BY_KEY[key]["name"] if key in DEPT_BY_KEY else None


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)
    phone = db.Column(db.String(30))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="CITIZEN", nullable=False)
    department = db.Column(db.String(40))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.String(30), unique=True, nullable=False)
    title = db.Column(db.String(180), nullable=False)
    category = db.Column(db.String(60), nullable=False)
    department = db.Column(db.String(40))
    description = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    address = db.Column(db.String(255))
    media_path = db.Column(db.String(255))
    resolution_media_path = db.Column(db.String(255))
    priority = db.Column(db.String(20), default="MEDIUM")
    status = db.Column(db.String(30), default="PENDING")
    citizen_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    resolution_note = db.Column(db.Text)
    reopen_count = db.Column(db.Integer, default=0)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = db.relationship("User", foreign_keys=[citizen_id])
    employee = db.relationship("User", foreign_keys=[employee_id])


class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ComplaintEvent(db.Model):
    """One line in a complaint's timeline."""
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False, index=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    action = db.Column(db.String(40), nullable=False)
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship("User")


class MediaFile(db.Model):
    """Uploaded evidence stored in the database so it survives redeploys
    (free hosts wipe the local disk on every deploy/restart)."""
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), unique=True, nullable=False)
    mimetype = db.Column(db.String(100))
    data = db.Column(db.LargeBinary().with_variant(LONGBLOB, "mysql"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ---------- helpers ----------

def iso(d):
    return d.isoformat() if d else None


def user_dict(user):
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "phone": user.phone, "role": user.role,
        "department": user.department, "department_name": dept_name(user.department),
    }


def due_at(c):
    days = SLA_DAYS.get(c.category, 7)
    days = min(days, PRIORITY_CAP_DAYS.get(c.priority, days))
    return (c.created_at or datetime.utcnow()) + timedelta(days=days)


def is_overdue(c):
    return c.status in OPEN_STATUSES and datetime.utcnow() > due_at(c)


def complaint_dict(c, feedback=None):
    fb = feedback if feedback is not None else Feedback.query.filter_by(complaint_id=c.id).first()
    return {
        "id": c.id,
        "complaint_id": c.complaint_id,
        "title": c.title,
        "category": c.category,
        "department": c.department or dept_for(c.category),
        "department_name": dept_name(c.department or dept_for(c.category)),
        "description": c.description,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "address": c.address,
        "media_url": f"/uploads/{c.media_path}" if c.media_path else None,
        "resolution_media_url": f"/uploads/{c.resolution_media_path}" if c.resolution_media_path else None,
        "priority": c.priority,
        "status": c.status,
        "citizen": user_dict(c.citizen) if c.citizen else None,
        "employee": user_dict(c.employee) if c.employee else None,
        "resolution_note": c.resolution_note,
        "reopen_count": c.reopen_count or 0,
        "escalated_to": ESCALATION.get(c.reopen_count or 0),
        "reopens_left": max(0, MAX_REOPENS - (c.reopen_count or 0)),
        "sla_days": SLA_DAYS.get(c.category, 7),
        "due_at": iso(due_at(c)),
        "overdue": is_overdue(c),
        "feedback": {"rating": fb.rating, "comment": fb.comment} if fb else None,
        "resolved_at": iso(c.resolved_at),
        "created_at": iso(c.created_at),
        "updated_at": iso(c.updated_at),
    }


def complaints_with_feedback(rows):
    ids = [c.id for c in rows]
    fbs = {f.complaint_id: f for f in Feedback.query.filter(Feedback.complaint_id.in_(ids)).all()} if ids else {}
    return [complaint_dict(c, fbs.get(c.id) or _NO_FB) for c in rows]


class _NoFeedback:
    """Sentinel so complaint_dict skips the per-row feedback query."""
    def __bool__(self):
        return False


_NO_FB = _NoFeedback()


def log_event(c, actor_id, action, note=None):
    db.session.add(ComplaintEvent(complaint_id=c.id, actor_id=actor_id, action=action, note=note))


def event_dict(e, public=False):
    d = {"action": e.action, "created_at": iso(e.created_at)}
    if not public:
        d["note"] = e.note
        d["actor"] = {"name": e.actor.name, "role": e.actor.role} if e.actor else None
    return d


def save_upload(file):
    if not allowed_file(file.filename):
        return None, "Unsupported file type"
    filename = secure_filename(f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{file.filename}")
    db.session.add(MediaFile(filename=filename,
                             mimetype=file.mimetype or mimetypes.guess_type(filename)[0],
                             data=file.read()))
    return filename, None


def haversine_m(lat1, lng1, lat2, lng2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            uid = int(get_jwt_identity())
            user = db.session.get(User, uid)
            if not user or user.role not in roles:
                return jsonify({"message": "Access denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def current_user():
    return db.session.get(User, int(get_jwt_identity()))


def can_view(user, c):
    if user.role == "ADMIN":
        return True
    if user.role == "CITIZEN":
        return c.citizen_id == user.id
    return c.employee_id == user.id


@app.errorhandler(413)
def too_large(_e):
    return jsonify({"message": "File too large (max 4 MB)"}), 413


# ---------- public ----------

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Citizen Connect API", "demo": SEED_DEMO})


@app.get("/api/departments")
def departments():
    return jsonify(DEPARTMENTS)


@app.get("/api/public/stats")
def public_stats():
    rows = Complaint.query.all()
    resolved = [c for c in rows if c.status == "RESOLVED"]
    hours = [(c.resolved_at - c.created_at).total_seconds() / 3600
             for c in resolved if c.resolved_at and c.created_at]
    ratings = [f.rating for f in Feedback.query.all()]
    recent = sorted(resolved, key=lambda c: c.resolved_at or c.updated_at or datetime.min, reverse=True)[:6]
    return jsonify({
        "total": len(rows),
        "resolved": len(resolved),
        "in_progress": sum(c.status in ("ASSIGNED", "IN_PROGRESS") for c in rows),
        "pending": sum(c.status == "PENDING" for c in rows),
        "avg_resolution_hours": round(sum(hours) / len(hours), 1) if hours else None,
        "avg_rating": round(sum(ratings) / len(ratings), 1) if ratings else None,
        "citizens": User.query.filter_by(role="CITIZEN").count(),
        "recent_resolved": [{
            "title": c.title, "category": c.category, "address": c.address,
            "resolved_at": iso(c.resolved_at or c.updated_at),
            "photo": f"/uploads/{c.resolution_media_path}" if c.resolution_media_path else None,
        } for c in recent],
    })


@app.get("/api/public/track/<code>")
def track(code):
    code = code.strip().upper()
    if not code.startswith("CC-"):
        code = "CC-" + code
    c = Complaint.query.filter_by(complaint_id=code).first()
    if not c:
        return jsonify({"message": "No complaint found with that ID"}), 404
    events = ComplaintEvent.query.filter_by(complaint_id=c.id).order_by(ComplaintEvent.created_at).all()
    return jsonify({
        "complaint_id": c.complaint_id, "title": c.title, "category": c.category,
        "department": c.department or dept_for(c.category),
        "department_name": dept_name(c.department or dept_for(c.category)),
        "priority": c.priority, "status": c.status, "address": c.address,
        "created_at": iso(c.created_at), "updated_at": iso(c.updated_at),
        "resolved_at": iso(c.resolved_at), "due_at": iso(due_at(c)), "overdue": is_overdue(c),
        "escalated_to": ESCALATION.get(c.reopen_count or 0),
        "events": [event_dict(e, public=True) for e in events],
    })


# ---------- auth ----------

@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    name, email, password = data.get("name"), data.get("email"), data.get("password")
    if not name or not email or not password:
        return jsonify({"message": "Name, email and password are required"}), 400
    email = email.lower().strip()
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409
    # The account registered with ADMIN_EMAIL becomes the site administrator
    admin_email = (os.getenv("ADMIN_EMAIL") or "").lower().strip()
    user = User(
        name=name.strip(), email=email,
        phone=data.get("phone", ""),
        password_hash=generate_password_hash(password),
        role="ADMIN" if admin_email and email == admin_email else "CITIZEN"
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registration successful"}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(email=(data.get("email") or "").lower().strip()).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"message": "Invalid email or password"}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user_dict(user)})


@app.get("/api/auth/me")
@jwt_required()
def me():
    return jsonify(user_dict(current_user()))


# ---------- complaints ----------

@app.post("/api/complaints")
@jwt_required()
def create_complaint():
    uid = int(get_jwt_identity())
    data = request.form
    if not data.get("title") or not data.get("category") or not data.get("description"):
        return jsonify({"message": "Title, category and description are required"}), 400
    priority = (data.get("priority") or "MEDIUM").upper()
    if priority not in PRIORITIES:
        return jsonify({"message": "Invalid priority"}), 400
    if data["category"] not in CATEGORY_DEPT:
        return jsonify({"message": "Please choose an issue type from the list"}), 400
    try:
        lat = float(data["latitude"]) if data.get("latitude") else None
        lng = float(data["longitude"]) if data.get("longitude") else None
    except ValueError:
        return jsonify({"message": "Invalid coordinates"}), 400

    media_path = None
    file = request.files.get("media")
    if file and file.filename:
        media_path, err = save_upload(file)
        if err:
            return jsonify({"message": err}), 400

    complaint = Complaint(
        complaint_id=f"CC-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[-10:]}",
        title=data["title"], category=data["category"], department=dept_for(data["category"]),
        description=data["description"],
        latitude=lat, longitude=lng, address=data.get("address"),
        priority=priority, citizen_id=uid, media_path=media_path, reopen_count=0,
    )
    db.session.add(complaint)
    db.session.flush()
    log_event(complaint, uid, "SUBMITTED", f"Routed to {dept_name(complaint.department)} department")
    db.session.commit()
    return jsonify(complaint_dict(complaint, _NO_FB)), 201


@app.get("/api/complaints")
@jwt_required()
def list_complaints():
    user = current_user()
    q = Complaint.query
    if user.role == "CITIZEN":
        q = q.filter_by(citizen_id=user.id)
    elif user.role == "EMPLOYEE":
        q = q.filter_by(employee_id=user.id)
    rows = q.order_by(Complaint.created_at.desc()).all()
    return jsonify(complaints_with_feedback(rows))


@app.get("/api/complaints/nearby")
@jwt_required()
def nearby():
    try:
        lat, lng = float(request.args["lat"]), float(request.args["lng"])
    except (KeyError, ValueError):
        return jsonify([])
    category = request.args.get("category")
    since = datetime.utcnow() - timedelta(days=60)
    q = Complaint.query.filter(Complaint.status.in_(OPEN_STATUSES), Complaint.created_at >= since,
                               Complaint.latitude.isnot(None))
    if category:
        q = q.filter_by(category=category)
    out = []
    for c in q.all():
        d = haversine_m(lat, lng, c.latitude, c.longitude)
        if d <= 300:
            out.append({"complaint_id": c.complaint_id, "title": c.title, "status": c.status,
                        "category": c.category, "distance_m": round(d), "created_at": iso(c.created_at)})
    return jsonify(sorted(out, key=lambda x: x["distance_m"])[:5])


@app.get("/api/complaints/<int:cid>")
@jwt_required()
def get_complaint(cid):
    user = current_user()
    c = db.session.get(Complaint, cid)
    if not c or not can_view(user, c):
        return jsonify({"message": "Complaint not found"}), 404
    events = ComplaintEvent.query.filter_by(complaint_id=c.id).order_by(ComplaintEvent.created_at).all()
    return jsonify({**complaint_dict(c), "events": [event_dict(e) for e in events]})


@app.patch("/api/complaints/<int:cid>/assign")
@role_required("ADMIN")
def assign_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c:
        return jsonify({"message": "Complaint not found"}), 404
    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    employee = db.session.get(User, employee_id) if employee_id else None
    if not employee or employee.role != "EMPLOYEE":
        return jsonify({"message": "Valid employee required"}), 400
    c.employee_id = employee.id
    if c.status == "PENDING":
        c.status = "ASSIGNED"
    log_event(c, int(get_jwt_identity()), "ASSIGNED", f"Assigned to {employee.name}"
              + (f" ({dept_name(employee.department)})" if employee.department else ""))
    db.session.commit()
    return jsonify(complaint_dict(c))


@app.patch("/api/complaints/<int:cid>/department")
@role_required("ADMIN")
def transfer_department(cid):
    c = db.session.get(Complaint, cid)
    if not c:
        return jsonify({"message": "Complaint not found"}), 404
    key = (request.get_json() or {}).get("department")
    if key not in DEPT_BY_KEY:
        return jsonify({"message": "Unknown department"}), 400
    if key != (c.department or dept_for(c.category)):
        c.department = key
        # the current field worker may belong to another department
        if c.employee and c.employee.department and c.employee.department != key:
            c.employee_id = None
            if c.status == "ASSIGNED":
                c.status = "PENDING"
        log_event(c, int(get_jwt_identity()), "TRANSFERRED", f"Moved to {dept_name(key)} department")
        db.session.commit()
    return jsonify(complaint_dict(c))


@app.patch("/api/complaints/<int:cid>/status")
@jwt_required()
def update_status(cid):
    user = current_user()
    c = db.session.get(Complaint, cid)
    if not c:
        return jsonify({"message": "Complaint not found"}), 404
    if user.role == "EMPLOYEE" and c.employee_id != user.id:
        return jsonify({"message": "Complaint not assigned to you"}), 403
    if user.role not in {"ADMIN", "EMPLOYEE"}:
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json() or {}
    status = data.get("status")
    if status not in STATUSES:
        return jsonify({"message": "Invalid status"}), 400
    note = data.get("resolution_note")
    changed = status != c.status
    c.status = status
    if note is not None:
        c.resolution_note = note
    if status == "RESOLVED" and changed:
        c.resolved_at = datetime.utcnow()
    elif status != "RESOLVED":
        c.resolved_at = None
    if changed:
        log_event(c, user.id, status, note or None)
    elif note:
        log_event(c, user.id, "NOTE", note)
    db.session.commit()
    return jsonify(complaint_dict(c))


@app.post("/api/complaints/<int:cid>/resolution-photo")
@jwt_required()
def resolution_photo(cid):
    user = current_user()
    c = db.session.get(Complaint, cid)
    if not c:
        return jsonify({"message": "Complaint not found"}), 404
    if not (user.role == "ADMIN" or (user.role == "EMPLOYEE" and c.employee_id == user.id)):
        return jsonify({"message": "Access denied"}), 403
    file = request.files.get("media")
    if not file or not file.filename:
        return jsonify({"message": "Choose a photo"}), 400
    path, err = save_upload(file)
    if err:
        return jsonify({"message": err}), 400
    c.resolution_media_path = path
    log_event(c, user.id, "PHOTO", "Added an after-work photo")
    db.session.commit()
    return jsonify(complaint_dict(c))


@app.post("/api/complaints/<int:cid>/reopen")
@role_required("CITIZEN")
def reopen(cid):
    uid = int(get_jwt_identity())
    c = db.session.get(Complaint, cid)
    if not c or c.citizen_id != uid:
        return jsonify({"message": "Complaint not found"}), 404
    if c.status not in ("RESOLVED", "REJECTED"):
        return jsonify({"message": "Only resolved or rejected complaints can be reopened"}), 400
    reason = ((request.get_json() or {}).get("reason") or "").strip()
    if not reason:
        return jsonify({"message": "Please tell us why the issue isn't fixed"}), 400
    if (c.reopen_count or 0) >= MAX_REOPENS:
        return jsonify({"message": "This complaint has already been reopened twice, the maximum allowed"}), 400
    c.status = "ASSIGNED" if c.employee_id else "PENDING"
    c.resolved_at = None
    c.reopen_count = (c.reopen_count or 0) + 1
    Feedback.query.filter_by(complaint_id=c.id).delete()
    log_event(c, uid, "REOPENED", f"Escalated to {ESCALATION[c.reopen_count]}: {reason}")
    db.session.commit()
    return jsonify(complaint_dict(c))


@app.post("/api/complaints/<int:cid>/feedback")
@role_required("CITIZEN")
def feedback(cid):
    uid = int(get_jwt_identity())
    c = db.session.get(Complaint, cid)
    if not c or c.citizen_id != uid:
        return jsonify({"message": "Complaint not found"}), 404
    if c.status != "RESOLVED":
        return jsonify({"message": "You can rate a complaint once it is resolved"}), 400
    data = request.get_json() or {}
    try:
        rating = int(data.get("rating", 0))
    except (TypeError, ValueError):
        rating = 0
    if rating < 1 or rating > 5:
        return jsonify({"message": "Rating must be 1 to 5"}), 400
    if Feedback.query.filter_by(complaint_id=cid, citizen_id=uid).first():
        return jsonify({"message": "Feedback already submitted"}), 409
    db.session.add(Feedback(complaint_id=cid, citizen_id=uid, rating=rating,
                            comment=data.get("comment", "")))
    log_event(c, uid, "RATED", f"{rating}/5" + (f" — {data.get('comment')}" if data.get("comment") else ""))
    db.session.commit()
    return jsonify({"message": "Feedback submitted"}), 201


# ---------- admin ----------

@app.get("/api/employees")
@role_required("ADMIN")
def employees():
    users = User.query.filter_by(role="EMPLOYEE").all()
    return jsonify([user_dict(u) for u in users])


@app.post("/api/employees")
@role_required("ADMIN")
def add_employee():
    data = request.get_json() or {}
    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Name, email and password are required"}), 400
    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"message": "Email already exists"}), 409
    department = data.get("department") or None
    if department and department not in DEPT_BY_KEY:
        return jsonify({"message": "Unknown department"}), 400
    u = User(name=data["name"], email=data["email"].lower().strip(), phone=data.get("phone", ""),
             password_hash=generate_password_hash(data["password"]), role="EMPLOYEE", department=department)
    db.session.add(u)
    db.session.commit()
    return jsonify(user_dict(u)), 201


@app.get("/api/admin/users")
@role_required("ADMIN")
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{**user_dict(u), "created_at": iso(u.created_at)} for u in users])


@app.patch("/api/admin/users/<int:user_id>")
@role_required("ADMIN")
def update_user(user_id):
    me_id = int(get_jwt_identity())
    u = db.session.get(User, user_id)
    if not u:
        return jsonify({"message": "User not found"}), 404
    data = request.get_json() or {}
    role = data.get("role")
    if role is not None:
        if role not in ROLES:
            return jsonify({"message": "Invalid role"}), 400
        if u.id == me_id and role != "ADMIN":
            return jsonify({"message": "You can't remove your own admin access"}), 400
        u.role = role
    if "department" in data:
        dep = data.get("department") or None
        if dep and dep not in DEPT_BY_KEY:
            return jsonify({"message": "Unknown department"}), 400
        u.department = dep
    password = data.get("password")
    if password is not None:
        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400
        u.password_hash = generate_password_hash(password)
    db.session.commit()
    return jsonify(user_dict(u))


@app.get("/api/admin/stats")
@role_required("ADMIN")
def stats():
    rows = Complaint.query.all()
    return jsonify({
        "total": len(rows),
        "pending": sum(c.status in ("PENDING", "ASSIGNED") for c in rows),
        "in_progress": sum(c.status == "IN_PROGRESS" for c in rows),
        "resolved": sum(c.status == "RESOLVED" for c in rows),
        "overdue": sum(is_overdue(c) for c in rows),
    })


@app.get("/api/admin/analytics")
@role_required("ADMIN")
def analytics():
    rows = Complaint.query.all()
    now = datetime.utcnow()
    today = now.date()
    days = [today - timedelta(days=i) for i in range(29, -1, -1)]
    created = Counter(c.created_at.date() for c in rows if c.created_at)
    resolved_on = Counter(c.resolved_at.date() for c in rows if c.resolved_at)
    by_cat = {}
    for c in rows:
        d = by_cat.setdefault(c.category, {"category": c.category, "total": 0, "resolved": 0, "overdue": 0})
        d["total"] += 1
        d["resolved"] += c.status == "RESOLVED"
        d["overdue"] += is_overdue(c)
    hours = [(c.resolved_at - c.created_at).total_seconds() / 3600
             for c in rows if c.resolved_at and c.created_at]
    within_sla = [c for c in rows if c.resolved_at and c.resolved_at <= due_at(c)]
    emp = {}
    for c in rows:
        if c.employee:
            e = emp.setdefault(c.employee_id, {"name": c.employee.name, "department": dept_name(c.employee.department),
                                               "assigned": 0, "resolved": 0, "open": 0})
            e["assigned"] += 1
            e["resolved"] += c.status == "RESOLVED"
            e["open"] += c.status in OPEN_STATUSES
    staff = Counter(u.department for u in User.query.filter_by(role="EMPLOYEE").all() if u.department)
    by_dept = []
    for d in DEPARTMENTS:
        cs = [c for c in rows if (c.department or dept_for(c.category)) == d["key"]]
        hrs = [(c.resolved_at - c.created_at).total_seconds() / 3600 for c in cs if c.resolved_at and c.created_at]
        by_dept.append({"key": d["key"], "name": d["name"], "icon": d["icon"], "total": len(cs),
                        "open": sum(c.status in OPEN_STATUSES for c in cs),
                        "resolved": sum(c.status == "RESOLVED" for c in cs),
                        "overdue": sum(is_overdue(c) for c in cs),
                        "avg_resolution_hours": round(sum(hrs) / len(hrs), 1) if hrs else None,
                        "staff": staff.get(d["key"], 0)})
    ratings = [f.rating for f in Feedback.query.all()]
    return jsonify({
        "by_department": by_dept,
        "total": len(rows),
        "open": sum(c.status in OPEN_STATUSES for c in rows),
        "resolved": sum(c.status == "RESOLVED" for c in rows),
        "overdue": sum(is_overdue(c) for c in rows),
        "avg_resolution_hours": round(sum(hours) / len(hours), 1) if hours else None,
        "sla_rate": round(100 * len(within_sla) / len(hours)) if hours else None,
        "avg_rating": round(sum(ratings) / len(ratings), 1) if ratings else None,
        "ratings": len(ratings),
        "by_status": {s: sum(c.status == s for c in rows) for s in
                      ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"]},
        "by_category": sorted(by_cat.values(), key=lambda d: -d["total"]),
        "daily": [{"date": d.isoformat(), "created": created.get(d, 0), "resolved": resolved_on.get(d, 0)}
                  for d in days],
        "employees": sorted(emp.values(), key=lambda e: -e["assigned"]),
        "points": [{"id": c.id, "complaint_id": c.complaint_id, "title": c.title, "status": c.status,
                    "category": c.category, "lat": c.latitude, "lng": c.longitude, "overdue": is_overdue(c)}
                   for c in rows if c.latitude is not None and c.longitude is not None],
    })


# ---------- files & frontend ----------

@app.get("/uploads/<path:filename>")
def uploads(filename):
    if os.path.isfile(os.path.join(UPLOAD_DIR, filename)):
        return send_from_directory(UPLOAD_DIR, filename)
    m = MediaFile.query.filter_by(filename=filename).first()
    if not m:
        return jsonify({"message": "File not found"}), 404
    resp = send_file(BytesIO(m.data), mimetype=m.mimetype or "application/octet-stream",
                     download_name=m.filename)
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp


@app.get("/")
@app.get("/<path:path>")
def frontend(path=""):
    if path.startswith("api/"):
        return jsonify({"message": "Not found"}), 404
    if path and os.path.isfile(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    index = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"message": "Frontend not built. Run npm run build in frontend/."}), 404


# ---------- startup ----------

def migrate():
    """Add columns introduced after the first release (create_all doesn't alter tables)."""
    wanted = {
        "complaint": {"resolution_media_path": "VARCHAR(255)", "resolved_at": "TIMESTAMP",
                      "reopen_count": "INTEGER DEFAULT 0", "department": "VARCHAR(40)"},
        "user": {"department": "VARCHAR(40)"},
    }
    insp = inspect(db.engine)
    for table, adds in wanted.items():
        cols = {c["name"] for c in insp.get_columns(table)}
        for name, typ in adds.items():
            if name not in cols:
                try:
                    with db.engine.begin() as conn:
                        conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN {name} {typ}'))
                except Exception as exc:  # another instance added it first
                    app.logger.warning("migrate %s.%s skipped: %s", table, name, exc)
    # route complaints filed before departments existed
    old = Complaint.query.filter(Complaint.department.is_(None)).all()
    for c in old:
        c.department = dept_for(c.category)
    if old:
        db.session.commit()


def seed():
    # Real admin account from environment variables (use this in production)
    admin_email = (os.getenv("ADMIN_EMAIL") or "").lower().strip()
    admin_password = os.getenv("ADMIN_PASSWORD")
    if admin_email and admin_password and not User.query.filter_by(email=admin_email).first():
        db.session.add(User(
            name=os.getenv("ADMIN_NAME", "Administrator"), email=admin_email,
            password_hash=generate_password_hash(admin_password), role="ADMIN"
        ))
        db.session.commit()
    # If that person already registered as a citizen, promote them to admin
    if admin_email:
        existing = User.query.filter_by(email=admin_email).first()
        if existing and existing.role != "ADMIN":
            existing.role = "ADMIN"
            db.session.commit()

    # Demo accounts with public passwords: local/demo use only
    if not SEED_DEMO:
        return
    demo = [
        ("Admin", "admin@citizenconnect.com", "admin123", "ADMIN"),
        ("Employee One", "employee@citizenconnect.com", "employee123", "EMPLOYEE"),
        ("Demo Citizen", "citizen@citizenconnect.com", "citizen123", "CITIZEN"),
    ]
    for name, email, password, role in demo:
        existing = User.query.filter_by(email=email).first()
        if existing and role == "EMPLOYEE" and not existing.department:
            existing.department = "LIGHTING"
        if not existing:
            db.session.add(User(
                name=name, email=email, password_hash=generate_password_hash(password), role=role,
                department="LIGHTING" if role == "EMPLOYEE" else None
            ))
    db.session.commit()


with app.app_context():
    try:
        db.create_all()
    except Exception as exc:  # another worker got there first
        db.session.rollback()
        app.logger.warning("create_all skipped: %s", exc)
    try:
        migrate()
    except Exception as exc:
        app.logger.warning("migrate skipped: %s", exc)
    try:
        seed()
    except Exception as exc:
        db.session.rollback()
        app.logger.warning("seed skipped: %s", exc)

if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
        host="0.0.0.0", port=int(os.getenv("PORT", 5000))
    )
