from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, validator
import math
import asyncio
import os
import uuid
import json
from pathlib import Path
import logging
from typing import Optional
import tempfile
import shutil

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CAD to GIS Converter", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# In-memory job tracking (use Redis in production)
# Job model structure:
# {
#     "status": str,           # JobStatus enum value
#     "filename": str,         # Original uploaded filename
#     "target_crs": str,       # Target coordinate reference system
#     "output_format": str,    # Output format (geojson)
#     "file_path": str,        # Path to uploaded DXF file
#     "progress": int,         # Progress percentage (0-100)
#     "message": str,          # Current status message
#     "output_path": str,      # Path to output file (set when completed)
#     "scale_factor": float,   # Optional: Scale factor applied (None for original conversions)
#     "parent_job_id": str     # Optional: Reference to original job (None for original conversions)
# }
jobs = {}

class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ScaleFactorRequest(BaseModel):
    """Request model for applying scale factor to converted file"""
    scale_factor: float = Field(
        ..., 
        ge=0.9, 
        le=1.1, 
        description="Scale factor to apply (0.9 to 1.1)",
        example=1.00013
    )
    output_format: Optional[str] = Field(
        None, 
        description="Output format (defaults to original format)",
        pattern="^(geojson)$"
    )

    @validator('scale_factor')
    def validate_scale_factor(cls, v):
        """Additional validation for scale factor"""
        if not isinstance(v, (int, float)):
            raise ValueError('Scale factor must be a number')
        
        if not (0.9 <= v <= 1.1):
            raise ValueError('Scale factor must be between 0.9 and 1.1')
        
        if not math.isfinite(v):
            raise ValueError('Scale factor must be a finite number')
        
        if v <= 0:
            raise ValueError('Scale factor must be greater than 0')
        
        return v

    @validator('output_format')
    def validate_output_format(cls, v):
        """Validate output format"""
        if v is not None and v != 'geojson':
            raise ValueError('Output format must be "geojson"')
        return v

class JobResponse(BaseModel):
    """Response model for job status - documents the job structure"""
    job_id: str
    status: str
    filename: str
    target_crs: str
    output_format: str
    file_path: str
    progress: int
    message: str
    output_path: Optional[str] = None
    scale_factor: Optional[float] = None  # Scale factor applied (None for original conversions)
    parent_job_id: Optional[str] = None   # Reference to original job (None for original conversions)

@app.get("/")
async def root():
    return {"message": "CAD to GIS Converter API"}

@app.post("/api/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_crs: str = Form("EPSG:4326"),
    output_format: str = Form("geojson")
):
    """Upload DXF file and start conversion process"""
    
    # Log received parameters
    logger.info(f"Upload received - target_crs: {target_crs}, output_format: {output_format}")
    
    # Validate file type
    if not file.filename.lower().endswith('.dxf'):
        raise HTTPException(status_code=400, detail="Only DXF files are supported")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")
    
    # Initialize job status
    jobs[job_id] = {
        "status": JobStatus.PENDING,
        "filename": file.filename,
        "target_crs": target_crs,
        "output_format": output_format,
        "file_path": str(file_path),
        "progress": 0,
        "message": "File uploaded successfully",
        "scale_factor": None,  # Optional field for scale factor metadata
        "parent_job_id": None  # Optional field to track original job
    }
    
    # Start background processing
    background_tasks.add_task(process_dxf_file, job_id)
    
    return {"job_id": job_id, "message": "File uploaded successfully"}

@app.get("/api/job/{job_id}")
async def get_job_status(job_id: str):
    """Get job status and progress"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = jobs[job_id].copy()
    job_data["job_id"] = job_id
    
    # Ensure backward compatibility by providing default values for optional fields
    if "scale_factor" not in job_data:
        job_data["scale_factor"] = None
    if "parent_job_id" not in job_data:
        job_data["parent_job_id"] = None
    
    return job_data

@app.get("/api/preview/{job_id}")
async def preview_result(job_id: str):
    """Preview converted GeoJSON file - always returns WGS84 for map display"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found")
    
    # Only support preview for GeoJSON
    if job['output_format'] != 'geojson':
        raise HTTPException(status_code=400, detail="Preview only available for GeoJSON")
    
    try:
        with open(output_path, 'r') as f:
            geojson_data = json.load(f)
        
        # If the target CRS is not WGS84, convert to WGS84 for preview
        target_crs = job.get("target_crs", "EPSG:4326")
        if target_crs != "EPSG:4326":
            import geopandas as gpd
            from io import StringIO
            
            # Convert GeoJSON to GeoDataFrame
            gdf = gpd.GeoDataFrame.from_features(geojson_data["features"], crs=target_crs)
            
            # Reproject to WGS84 for map display
            gdf_wgs84 = gdf.to_crs("EPSG:4326")
            
            # Convert back to GeoJSON
            geojson_data = json.loads(gdf_wgs84.to_json())
            
            # Add WGS84 CRS info
            geojson_data["crs"] = {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                }
            }
            
            logger.info(f"Reprojected preview from {target_crs} to EPSG:4326 for map display")
        
        return geojson_data
    except Exception as e:
        logger.error(f"Failed to read preview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load preview: {str(e)}")

@app.get("/api/download/{job_id}")
async def download_result(job_id: str):
    """Download converted file"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        logger.error(f"Output file not found: {output_path}")
        raise HTTPException(status_code=404, detail="Output file not found")
    
    logger.info(f"Downloading file: {output_path}")
    
    # Get the original filename without extension
    base_filename = os.path.splitext(job['filename'])[0]
    download_filename = f"{base_filename}_converted.{job['output_format']}"
    
    # Determine media type based on format
    if job['output_format'] == 'geojson':
        media_type = "application/json"
    else:
        media_type = "application/zip"
    
    return FileResponse(
        path=output_path,
        media_type=media_type,
        filename=download_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"'
        }
    )

@app.post("/api/reproject/{job_id}")
async def reproject_file(
    job_id: str,
    background_tasks: BackgroundTasks,
    target_crs: str,
    output_format: Optional[str] = None
):
    """Reproject an already converted file to a different CRS"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    original_job = jobs[job_id]
    
    # Check if original file still exists
    if not os.path.exists(original_job["file_path"]):
        raise HTTPException(status_code=404, detail="Original DXF file no longer available")
    
    # Create a new job for reprojection
    new_job_id = str(uuid.uuid4())
    
    # Use same output format if not specified
    if output_format is None:
        output_format = original_job["output_format"]
    
    jobs[new_job_id] = {
        "status": JobStatus.PENDING,
        "filename": original_job["filename"],
        "target_crs": target_crs,
        "output_format": output_format,
        "file_path": original_job["file_path"],
        "progress": 0,
        "message": "Reprojecting to new coordinate system...",
        "scale_factor": None,  # No scale factor for reprojection jobs
        "parent_job_id": job_id
    }
    
    # Start background processing
    background_tasks.add_task(process_dxf_file, new_job_id)
    
    return {"job_id": new_job_id, "message": "Reprojection started"}

@app.post("/api/apply-scale-factor/{job_id}")
async def apply_scale_factor(
    job_id: str,
    request: ScaleFactorRequest,
    background_tasks: BackgroundTasks
):
    """Apply scale factor to an already converted file"""
    try:
        # Validate job_id format
        if not job_id or not isinstance(job_id, str) or job_id.strip() == "":
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # Validate original job exists
        if job_id not in jobs:
            logger.warning(f"Scale factor request for non-existent job: {job_id}")
            raise HTTPException(status_code=404, detail="Job not found")
        
        original_job = jobs[job_id]
        
        # Validate original job has completed successfully
        if original_job["status"] != JobStatus.COMPLETED:
            logger.warning(f"Scale factor request for incomplete job {job_id}: status={original_job['status']}")
            raise HTTPException(
                status_code=400, 
                detail=f"Original job must be completed. Current status: {original_job['status']}"
            )
        
        # Validate output file exists
        output_path = original_job.get("output_path")
        if not output_path:
            logger.error(f"No output path found for job {job_id}")
            raise HTTPException(status_code=404, detail="Original conversion output path not found")
        
        if not os.path.exists(output_path):
            logger.error(f"Output file does not exist: {output_path}")
            raise HTTPException(status_code=404, detail="Original conversion output file not found")
        
        # Validate file is readable
        try:
            with open(output_path, 'r') as f:
                # Try to read first few bytes to ensure file is accessible
                f.read(100)
        except Exception as e:
            logger.error(f"Cannot read output file {output_path}: {e}")
            raise HTTPException(status_code=500, detail="Original conversion file is not accessible")
        
        # Create new job for scaled conversion
        new_job_id = str(uuid.uuid4())
        
        # Use same output format if not specified
        output_format = request.output_format or original_job["output_format"]
        
        # Validate output format
        if output_format != 'geojson':
            logger.error(f"Invalid output format: {output_format}")
            raise HTTPException(status_code=400, detail="Output format must be 'geojson'")
        
        jobs[new_job_id] = {
            "status": JobStatus.PENDING,
            "filename": original_job["filename"],
            "target_crs": original_job["target_crs"],
            "output_format": output_format,
            "file_path": original_job["file_path"],
            "scale_factor": request.scale_factor,
            "progress": 0,
            "message": f"Applying scale factor {request.scale_factor}...",
            "parent_job_id": job_id
        }
        
        logger.info(f"Created scale factor job {new_job_id} for original job {job_id} with factor {request.scale_factor}")
        
        # Start background processing
        background_tasks.add_task(process_scaled_conversion, new_job_id)
        
        return {
            "job_id": new_job_id,
            "message": "Scale factor application started",
            "scale_factor": request.scale_factor
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in apply_scale_factor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

async def process_dxf_file(job_id: str):
    """Background task to process DXF file"""
    try:
        job = jobs[job_id]
        job["status"] = JobStatus.PROCESSING
        job["progress"] = 10
        job["message"] = "Starting DXF processing..."
        
        # Simulate processing steps
        await asyncio.sleep(1)
        job["progress"] = 30
        job["message"] = "Parsing DXF file..."
        
        # Import processing modules
        from .dxf_processor import DXFProcessor
        
        processor = DXFProcessor()
        
        # Process the file
        job["progress"] = 50
        job["message"] = "Converting geometries..."
        
        result = await processor.convert_dxf_to_gis(
            job["file_path"],
            job["target_crs"],
            job["output_format"]
        )
        
        job["progress"] = 80
        job["message"] = "Generating output file..."
        
        # Save result
        output_filename = f"{job_id}_converted.{job['output_format']}"
        output_path = OUTPUT_DIR / output_filename
        
        # Save as GeoJSON
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        job["output_path"] = str(output_path)
        job["progress"] = 100
        job["status"] = JobStatus.COMPLETED
        job["message"] = "Conversion completed successfully!"
        
    except Exception as e:
        logger.error(f"Processing failed for job {job_id}: {e}")
        jobs[job_id]["status"] = JobStatus.FAILED
        jobs[job_id]["message"] = f"Processing failed: {str(e)}"

async def process_scaled_conversion(job_id: str):
    """Background task to apply scale factor to existing conversion"""
    try:
        # Validate job exists
        if job_id not in jobs:
            logger.error(f"Scale conversion job {job_id} not found")
            return
        
        job = jobs[job_id]
        job["status"] = JobStatus.PROCESSING
        job["progress"] = 10
        job["message"] = "Initializing scale factor application..."
        
        # Validate parent job exists
        parent_job_id = job.get("parent_job_id")
        if not parent_job_id or parent_job_id not in jobs:
            raise Exception(f"Parent job {parent_job_id} not found")
        
        original_job = jobs[parent_job_id]
        original_output_path = original_job.get("output_path")
        
        if not original_output_path:
            raise Exception("Original job has no output path")
        
        if not os.path.exists(original_output_path):
            raise Exception(f"Original output file not found: {original_output_path}")
        
        job["progress"] = 20
        job["message"] = "Loading original conversion..."
        
        # Load and validate original GeoJSON
        try:
            with open(original_output_path, 'r') as f:
                geojson_data = json.load(f)
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON in original file: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to read original file: {str(e)}")
        
        # Validate GeoJSON structure
        if not isinstance(geojson_data, dict):
            raise Exception("Original file is not a valid GeoJSON object")
        
        if geojson_data.get("type") != "FeatureCollection":
            raise Exception("Original file is not a FeatureCollection")
        
        if "features" not in geojson_data or not isinstance(geojson_data["features"], list):
            raise Exception("Original file does not contain valid features array")
        
        job["progress"] = 40
        job["message"] = f"Applying scale factor {job['scale_factor']}..."
        
        # Import processing modules
        from .dxf_processor import DXFProcessor
        
        processor = DXFProcessor()
        
        # Validate scale factor
        scale_factor = job.get("scale_factor")
        if not isinstance(scale_factor, (int, float)) or not math.isfinite(scale_factor):
            raise Exception(f"Invalid scale factor: {scale_factor}")
        
        if not (0.9 <= scale_factor <= 1.1):
            raise Exception(f"Scale factor {scale_factor} is outside valid range (0.9-1.1)")
        
        # Apply scale factor
        try:
            scaled_result = processor.apply_scale_to_geojson(
                geojson_data,
                scale_factor,
                job["output_format"]
            )
        except Exception as e:
            raise Exception(f"Scale factor transformation failed: {str(e)}")
        
        job["progress"] = 70
        job["message"] = "Saving scaled output..."
        
        # Ensure output directory exists
        OUTPUT_DIR.mkdir(exist_ok=True)
        
        # Save scaled result
        output_filename = f"{job_id}_scaled.{job['output_format']}"
        output_path = OUTPUT_DIR / output_filename
        
        try:
            # Validate scaled result is valid JSON
            if not isinstance(scaled_result, dict):
                raise Exception("Scaled result is not a valid JSON object")
            
            # Save as GeoJSON
            with open(output_path, 'w') as f:
                json.dump(scaled_result, f, indent=2)
        except Exception as e:
            raise Exception(f"Failed to save scaled output: {str(e)}")
        
        # Validate output file was created
        if not os.path.exists(output_path):
            raise Exception("Output file was not created successfully")
        
        # Validate output file size
        file_size = os.path.getsize(output_path)
        if file_size == 0:
            raise Exception("Output file is empty")
        
        job["output_path"] = str(output_path)
        job["progress"] = 100
        job["status"] = JobStatus.COMPLETED
        job["message"] = f"Scale factor {job['scale_factor']} applied successfully!"
        
        logger.info(f"Scale factor application completed for job {job_id}: {output_path} ({file_size} bytes)")
        
    except Exception as e:
        error_msg = f"Scale factor application failed: {str(e)}"
        logger.error(f"Job {job_id}: {error_msg}", exc_info=True)
        
        # Ensure job exists before updating status
        if job_id in jobs:
            jobs[job_id]["status"] = JobStatus.FAILED
            jobs[job_id]["message"] = error_msg
            jobs[job_id]["progress"] = 0

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)