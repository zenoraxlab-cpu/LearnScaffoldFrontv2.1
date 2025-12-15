from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
import random
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

RESULTS_DIR = ROOT_DIR / 'results'
RESULTS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'learnscaffold')]

# Create the main app
app = FastAPI(title="LearnScaffold API", version="2.1.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class AnalysisInitResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    pages_or_elements: int
    detected_language: str
    suggested_plan: dict
    estimated_processing_time_min: int

class GenerateRequest(BaseModel):
    task_id: str
    days: int = Field(ge=1, le=365)
    hours_per_day: float = Field(ge=0.5, le=24)

class TaskStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress_percent: int = Field(ge=0, le=100)
    current_step: str
    eta_minutes: Optional[int] = None
    result_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

class EmailNotifyRequest(BaseModel):
    task_id: str
    email: EmailStr

class EmailNotifyResponse(BaseModel):
    success: bool
    message: str

# Legacy models
class LegacyUploadResponse(BaseModel):
    file_id: str
    filename: str
    status: str

class LegacyAnalyzeRequest(BaseModel):
    file_id: str

class LegacyGenerateRequest(BaseModel):
    file_id: str
    days: int
    hours_per_day: float

# ==================== Helper Functions ====================

ALLOWED_EXTENSIONS = {'.pdf', '.mp4', '.mp3', '.txt'}

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()

def is_allowed_file(filename: str) -> bool:
    return get_file_extension(filename) in ALLOWED_EXTENSIONS

def estimate_elements(file_size: int, file_type: str) -> int:
    """Estimate pages/elements based on file size and type"""
    if file_type == '.pdf':
        # Rough estimate: ~50KB per page
        return max(1, file_size // 50000)
    elif file_type == '.mp4':
        # Rough estimate: ~10MB per minute of video
        return max(1, file_size // 10000000)
    elif file_type == '.mp3':
        # Rough estimate: ~1MB per minute of audio
        return max(1, file_size // 1000000)
    elif file_type == '.txt':
        # Rough estimate: ~2KB per page
        return max(1, file_size // 2000)
    return 1

def estimate_processing_time(elements: int, file_type: str) -> int:
    """Estimate processing time in minutes"""
    base_time = 2  # Base processing time
    if file_type == '.pdf':
        return base_time + (elements * 1)
    elif file_type in ['.mp4', '.mp3']:
        return base_time + (elements * 3)  # Video/audio takes longer
    elif file_type == '.txt':
        return base_time + max(1, elements // 2)
    return base_time + elements

def generate_signed_url(task_id: str, hours_valid: int = 24) -> str:
    """Generate a signed URL for result download"""
    expiry = datetime.now(timezone.utc) + timedelta(hours=hours_valid)
    token = secrets.token_urlsafe(32)
    return f"/api/analyze/download/{task_id}?token={token}&expires={expiry.isoformat()}"

# ==================== Background Tasks ====================

async def process_analysis_task(task_id: str, days: int, hours_per_day: float):
    """Simulate long-running analysis task"""
    try:
        # Get task from DB
        task = await db.tasks.find_one({"task_id": task_id})
        if not task:
            logger.error(f"Task {task_id} not found")
            return
        
        steps = [
            "Extracting content...",
            "Analyzing structure...",
            "Identifying key concepts...",
            "Building knowledge graph...",
            "Generating study plan...",
            "Optimizing schedule...",
            "Finalizing output..."
        ]
        
        total_steps = len(steps)
        estimated_time = task.get('estimated_processing_time_min', 5)
        step_duration = max(5, (estimated_time * 60) // total_steps)  # Simulate with shorter times
        
        for i, step in enumerate(steps):
            progress = int((i / total_steps) * 100)
            eta = max(1, (total_steps - i) * step_duration // 60)
            
            await db.tasks.update_one(
                {"task_id": task_id},
                {"$set": {
                    "status": "processing",
                    "progress_percent": progress,
                    "current_step": step,
                    "eta_minutes": eta,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Simulate processing time (reduced for demo)
            await asyncio.sleep(random.uniform(2, 5))
        
        # Generate result
        result_filename = f"study_plan_{task_id}.json"
        result_path = RESULTS_DIR / result_filename
        
        # Create study plan result
        study_plan = {
            "task_id": task_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "plan_settings": {
                "total_days": days,
                "hours_per_day": hours_per_day
            },
            "study_plan": {
                "title": f"Study Plan - {task.get('filename', 'Unknown')}",
                "total_hours": days * hours_per_day,
                "days": [
                    {
                        "day": d + 1,
                        "topics": [f"Topic {d + 1}.{t + 1}" for t in range(3)],
                        "activities": ["Reading", "Practice", "Review"],
                        "estimated_hours": hours_per_day
                    }
                    for d in range(min(days, 30))  # Limit preview to 30 days
                ]
            }
        }
        
        import json
        with open(result_path, 'w') as f:
            json.dump(study_plan, f, indent=2)
        
        result_url = generate_signed_url(task_id)
        
        await db.tasks.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "completed",
                "progress_percent": 100,
                "current_step": "Completed",
                "eta_minutes": 0,
                "result_url": result_url,
                "result_path": str(result_path),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Check if email notification was requested
        email_request = await db.email_notifications.find_one({"task_id": task_id})
        if email_request:
            logger.info(f"Would send email to {email_request['email']} for task {task_id}")
            # In production, send actual email here
            await db.email_notifications.update_one(
                {"task_id": task_id},
                {"$set": {"sent": True, "sent_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        logger.info(f"Task {task_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing task {task_id}: {str(e)}")
        await db.tasks.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

# ==================== New Staged API Endpoints ====================

@api_router.post("/analyze/init", response_model=AnalysisInitResponse)
async def analyze_init(file: UploadFile = File(...)):
    """Stage 1: Upload file and get initial analysis summary"""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = get_file_extension(file.filename)
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Allowed: PDF, MP4, MP3, TXT"
        )
    
    # Read file
    content = await file.read()
    file_size = len(content)
    
    # Generate task ID
    task_id = str(uuid.uuid4())
    
    # Save file
    file_path = UPLOADS_DIR / f"{task_id}{file_ext}"
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Analyze file
    elements = estimate_elements(file_size, file_ext)
    processing_time = estimate_processing_time(elements, file_ext)
    
    # Create suggested plan
    suggested_days = max(7, min(30, elements * 2))
    suggested_plan = {
        "recommended_days": suggested_days,
        "recommended_hours_per_day": 2.0,
        "total_hours": suggested_days * 2.0
    }
    
    # Store task in DB
    task_doc = {
        "task_id": task_id,
        "filename": file.filename,
        "file_type": file_ext,
        "file_size_bytes": file_size,
        "file_path": str(file_path),
        "pages_or_elements": elements,
        "detected_language": "en",  # Always report EN
        "suggested_plan": suggested_plan,
        "estimated_processing_time_min": processing_time,
        "status": "pending",
        "progress_percent": 0,
        "current_step": "Waiting to start",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.insert_one(task_doc)
    
    logger.info(f"Created task {task_id} for file {file.filename}")
    
    return AnalysisInitResponse(
        task_id=task_id,
        filename=file.filename,
        file_type=file_ext,
        file_size_bytes=file_size,
        pages_or_elements=elements,
        detected_language="en",
        suggested_plan=suggested_plan,
        estimated_processing_time_min=processing_time
    )

@api_router.post("/analyze/generate", response_model=TaskStatus)
async def analyze_generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Stage 2: Start generation with custom parameters"""
    
    # Find task
    task = await db.tasks.find_one({"task_id": request.task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.get("status") == "processing":
        raise HTTPException(status_code=400, detail="Task is already processing")
    
    if task.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Task is already completed")
    
    # Update task with generation parameters
    await db.tasks.update_one(
        {"task_id": request.task_id},
        {"$set": {
            "days": request.days,
            "hours_per_day": request.hours_per_day,
            "status": "processing",
            "current_step": "Starting...",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Start background processing
    background_tasks.add_task(process_analysis_task, request.task_id, request.days, request.hours_per_day)
    
    # Return current status
    updated_task = await db.tasks.find_one({"task_id": request.task_id})
    
    return TaskStatus(
        task_id=request.task_id,
        status=updated_task.get("status", "processing"),
        progress_percent=updated_task.get("progress_percent", 0),
        current_step=updated_task.get("current_step", "Starting..."),
        eta_minutes=updated_task.get("estimated_processing_time_min"),
        created_at=updated_task.get("created_at"),
        updated_at=updated_task.get("updated_at")
    )

@api_router.get("/analyze/status/{task_id}", response_model=TaskStatus)
async def analyze_status(task_id: str):
    """Get current status of a task"""
    
    task = await db.tasks.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskStatus(
        task_id=task_id,
        status=task.get("status", "pending"),
        progress_percent=task.get("progress_percent", 0),
        current_step=task.get("current_step", "Unknown"),
        eta_minutes=task.get("eta_minutes"),
        result_url=task.get("result_url"),
        error_message=task.get("error_message"),
        created_at=task.get("created_at"),
        updated_at=task.get("updated_at")
    )

@api_router.get("/analyze/download/{task_id}")
async def analyze_download(task_id: str, token: Optional[str] = None):
    """Download the result file"""
    
    task = await db.tasks.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Task is not completed yet")
    
    result_path = task.get("result_path")
    if not result_path or not Path(result_path).exists():
        raise HTTPException(status_code=404, detail="Result file not found")
    
    return FileResponse(
        path=result_path,
        filename=f"study_plan_{task_id}.json",
        media_type="application/json"
    )

@api_router.post("/notify/email", response_model=EmailNotifyResponse)
async def notify_email(request: EmailNotifyRequest):
    """Register email for notification when task completes"""
    
    task = await db.tasks.find_one({"task_id": request.task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Store email notification request
    await db.email_notifications.update_one(
        {"task_id": request.task_id},
        {"$set": {
            "task_id": request.task_id,
            "email": request.email,
            "sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    logger.info(f"Email notification registered for task {request.task_id}: {request.email}")
    
    return EmailNotifyResponse(
        success=True,
        message="Email notification registered. You will receive an email when processing is complete."
    )

# ==================== Legacy API Endpoints (Fallback) ====================

@api_router.post("/upload/", response_model=LegacyUploadResponse)
async def legacy_upload(file: UploadFile = File(...)):
    """Legacy: Upload file"""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = get_file_extension(file.filename)
    if not is_allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    content = await file.read()
    file_id = str(uuid.uuid4())
    
    file_path = UPLOADS_DIR / f"{file_id}{file_ext}"
    with open(file_path, 'wb') as f:
        f.write(content)
    
    await db.legacy_files.insert_one({
        "file_id": file_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_size": len(content),
        "file_type": file_ext,
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return LegacyUploadResponse(
        file_id=file_id,
        filename=file.filename,
        status="uploaded"
    )

@api_router.post("/analyze/")
async def legacy_analyze(request: LegacyAnalyzeRequest, background_tasks: BackgroundTasks):
    """Legacy: Start analysis"""
    
    file_doc = await db.legacy_files.find_one({"file_id": request.file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    await db.legacy_files.update_one(
        {"file_id": request.file_id},
        {"$set": {"status": "analyzing", "progress": 0}}
    )
    
    return {"file_id": request.file_id, "status": "analyzing"}

@api_router.get("/analyze/legacy/status/{file_id}")
async def legacy_analyze_status(file_id: str):
    """Legacy: Get analysis status"""
    
    file_doc = await db.legacy_files.find_one({"file_id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "file_id": file_id,
        "status": file_doc.get("status", "unknown"),
        "progress": file_doc.get("progress", 0)
    }

@api_router.post("/generate/generate")
async def legacy_generate(request: LegacyGenerateRequest):
    """Legacy: Generate study plan"""
    
    file_doc = await db.legacy_files.find_one({"file_id": request.file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "file_id": request.file_id,
        "status": "generating",
        "days": request.days,
        "hours_per_day": request.hours_per_day
    }

@api_router.post("/plan/pdf")
async def legacy_pdf(file_id: str):
    """Legacy: Get PDF plan"""
    
    file_doc = await db.legacy_files.find_one({"file_id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"file_id": file_id, "pdf_url": f"/api/download/{file_id}.pdf"}

# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "LearnScaffold API v2.1", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.1.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
