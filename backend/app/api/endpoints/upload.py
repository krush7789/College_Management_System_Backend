from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.config import settings
import cloudinary
import cloudinary.uploader
from app.core.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload"])

# Configure Cloudinary
cloudinary.config( 
  cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
  api_key = settings.CLOUDINARY_API_KEY, 
  api_secret = settings.CLOUDINARY_API_SECRET 
)

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """
    Upload an image to Cloudinary and return the URL.
    Restricted to Admins for now (or Teachers).
    """
    if not settings.CLOUDINARY_CLOUD_NAME:
         raise HTTPException(status_code=500, detail="Cloudinary not configured")

    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Upload
        # UploadFile.file is a SpooledTemporaryFile
        result = cloudinary.uploader.upload(file.file, folder="uniportal/profiles")
        
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
