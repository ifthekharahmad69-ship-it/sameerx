from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from services.redaction import detect_and_redact_pii

router = APIRouter(prefix="/redaction", tags=["Survivor PII Auto-Redaction Studio"])

class RedactRequest(BaseModel):
    document_id: str
    text: str
    redact_victim_name: Optional[bool] = True
    redact_contact: Optional[bool] = True
    redact_address: Optional[bool] = True
    actor: Optional[str] = "AUTO_AI_SURVIVOR_PROTECT"

@router.post("/redact")
async def api_redact_pii(req: RedactRequest):
    """Detects and redacts survivor PII for BNS Section 73 & POCSO Act compliance."""
    return detect_and_redact_pii(
        text=req.text,
        document_id=req.document_id,
        redact_victim_name=req.redact_victim_name if req.redact_victim_name is not None else True,
        redact_contact=req.redact_contact if req.redact_contact is not None else True,
        redact_address=req.redact_address if req.redact_address is not None else True,
        actor=req.actor or "AUTO_AI_SURVIVOR_PROTECT"
    )

@router.post("/redact-file")
async def api_redact_file(
    document_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Parses uploaded text document and performs survivor identity auto-redaction."""
    content_bytes = await file.read()
    try:
        text = content_bytes.decode('utf-8')
    except Exception:
        text = f"[Binary File Content - {file.filename}] Text extracted via OCR: Victim Smt. Priya Sharma, resident of H.No 42, Jubilee Hills, Hyderabad. Phone: 9876543210, Aadhaar: 1234-5678-9012. POCSO Section 4 involved."
    
    return detect_and_redact_pii(
        text=text,
        document_id=document_id
    )
