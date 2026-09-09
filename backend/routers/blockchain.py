from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from services.blockchain import (
    anchor_document_hash,
    verify_document_integrity,
    get_ledger_history,
    calculate_sha256
)

router = APIRouter(prefix="/blockchain", tags=["Blockchain Audit Ledger"])

class AnchorRequest(BaseModel):
    document_id: str
    content: str
    actor_badge_id: Optional[str] = "IO-8821"
    action_type: Optional[str] = "ANCHOR_HASH"

class VerifyRequest(BaseModel):
    document_id: str
    content: str

@router.post("/anchor")
async def api_anchor_document(req: AnchorRequest):
    """Anchors document SHA-256 hash onto the immutable ledger."""
    res = anchor_document_hash(
        document_id=req.document_id,
        content=req.content,
        actor_badge_id=req.actor_badge_id or "IO-8821",
        action_type=req.action_type or "ANCHOR_HASH"
    )
    return res

@router.post("/anchor-file")
async def api_anchor_file(
    document_id: str = Form(...),
    actor_badge_id: str = Form("IO-8821"),
    file: UploadFile = File(...)
):
    """Anchors uploaded file SHA-256 hash onto the ledger."""
    file_bytes = await file.read()
    res = anchor_document_hash(
        document_id=document_id,
        content=file_bytes,
        actor_badge_id=actor_badge_id,
        action_type="ANCHOR_FILE_HASH"
    )
    return res

@router.post("/verify")
async def api_verify_document(req: VerifyRequest):
    """Verifies text content against the anchored SHA-256 ledger hash."""
    return verify_document_integrity(document_id=req.document_id, content=req.content)

@router.post("/verify-file")
async def api_verify_file(
    document_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Verifies uploaded file content against the anchored ledger hash."""
    file_bytes = await file.read()
    return verify_document_integrity(document_id=document_id, content=file_bytes)

@router.get("/chain")
async def api_get_ledger_history(document_id: Optional[str] = None):
    """Retrieves full or document-filtered blockchain audit ledger entries."""
    history = get_ledger_history(document_id=document_id)
    return {
        "count": len(history),
        "ledger": history
    }
