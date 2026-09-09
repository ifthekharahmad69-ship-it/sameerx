import time
import uuid
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

try:
    from db.supabase_client import supabase
except Exception:
    supabase = None

router = APIRouter(prefix="/evidence", tags=["Physical Evidence & Barcode Manager"])

# In-memory evidence repository fallback
IN_MEMORY_EVIDENCE: Dict[str, Dict[str, Any]] = {
    "EVD-CRIM-2025-01": {
        "id": "evd-uuid-001",
        "case_id": "m1",
        "barcode_id": "EVD-CRIM-2025-01",
        "evidence_type": "Seized Mobile Phone",
        "description": "Samsung Galaxy S22 Ultra recovered from crime spot with blood splatter specimen #2",
        "custodian_badge_id": "IO-8821 (Insp. Ramesh)",
        "seizure_location": "Banjara Hills Rd #12, Hyderabad",
        "created_at": "2025-05-12T14:30:00Z",
        "chain_of_custody": [
            {
                "timestamp": "2025-05-12T14:30:00Z",
                "custodian": "IO-8821 (Insp. Ramesh)",
                "action": "SEIZURE_AND_BARCODING",
                "location": "Malkhana Police Station #4",
                "signature_hash": "0xa1b2c3d4e5f67890123456789abcdef012345678"
            },
            {
                "timestamp": "2025-05-14T09:15:00Z",
                "custodian": "FSL-EXP-402 (Dr. Ananya, Cyber Forensics)",
                "action": "TRANSFERRED_TO_FORENSIC_LAB",
                "location": "State Forensic Science Laboratory, TS",
                "signature_hash": "0xf9e8d7c6b5a43210987654321fedcba987654321"
            }
        ]
    }
}

class EvidenceRegisterRequest(BaseModel):
    case_id: str
    evidence_type: str
    description: str
    custodian_badge_id: str
    seizure_location: str
    barcode_id: Optional[str] = None

class CustodyTransferRequest(BaseModel):
    barcode_id: str
    new_custodian_badge_id: str
    transfer_reason: str
    location: str

@router.post("/register")
async def api_register_evidence(req: EvidenceRegisterRequest):
    """Registers a new physical evidence item with barcode voucher generation."""
    barcode = req.barcode_id or f"EVD-{req.case_id.upper()}-{int(time.time()) % 10000:04d}"
    
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    sig_raw = f"{barcode}:{req.custodian_badge_id}:{timestamp}"
    initial_signature = f"0x{hashlib.sha256(sig_raw.encode()).hexdigest()[:40]}"

    item = {
        "id": str(uuid.uuid4()),
        "case_id": req.case_id,
        "barcode_id": barcode,
        "evidence_type": req.evidence_type,
        "description": req.description,
        "custodian_badge_id": req.custodian_badge_id,
        "seizure_location": req.seizure_location,
        "created_at": timestamp,
        "chain_of_custody": [
            {
                "timestamp": timestamp,
                "custodian": req.custodian_badge_id,
                "action": "SEIZURE_AND_BARCODING",
                "location": req.seizure_location,
                "signature_hash": initial_signature
            }
        ]
    }

    IN_MEMORY_EVIDENCE[barcode] = item

    if supabase:
        try:
            supabase.table("evidence_items").insert({
                "id": item["id"],
                "case_id": item["case_id"],
                "barcode_id": item["barcode_id"],
                "evidence_type": item["evidence_type"],
                "description": item["description"],
                "custodian_badge_id": item["custodian_badge_id"],
                "seizure_location": item["seizure_location"],
                "chain_of_custody": item["chain_of_custody"]
            }).execute()
        except Exception as e:
            print(f"[Evidence Router] DB insert warning: {e}")

    return {
        "success": True,
        "message": "Physical Evidence successfully registered & voucher barcoded.",
        "evidence": item
    }

@router.post("/transfer")
async def api_transfer_custody(req: CustodyTransferRequest):
    """Transfers physical evidence custody with cryptographic handoff log."""
    item = IN_MEMORY_EVIDENCE.get(req.barcode_id)
    
    if not item and supabase:
        try:
            res = supabase.table("evidence_items").select("*").eq("barcode_id", req.barcode_id).execute()
            if res.data:
                item = res.data[0]
        except Exception:
            pass

    if not item:
        raise HTTPException(status_code=404, detail=f"Evidence barcode {req.barcode_id} not found.")

    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    sig_raw = f"{req.barcode_id}:{req.new_custodian_badge_id}:{timestamp}:{req.transfer_reason}"
    signature = f"0x{hashlib.sha256(sig_raw.encode()).hexdigest()[:40]}"

    transfer_event = {
        "timestamp": timestamp,
        "custodian": req.new_custodian_badge_id,
        "action": f"CUSTODY_TRANSFER: {req.transfer_reason}",
        "location": req.location,
        "signature_hash": signature
    }

    item["chain_of_custody"].append(transfer_event)
    item["custodian_badge_id"] = req.new_custodian_badge_id
    IN_MEMORY_EVIDENCE[req.barcode_id] = item

    if supabase:
        try:
            supabase.table("evidence_items").update({
                "custodian_badge_id": req.new_custodian_badge_id,
                "chain_of_custody": item["chain_of_custody"]
            }).eq("barcode_id", req.barcode_id).execute()
        except Exception as e:
            print(f"[Evidence Router] DB update warning: {e}")

    return {
        "success": True,
        "message": f"Custody transferred to {req.new_custodian_badge_id}.",
        "barcode_id": req.barcode_id,
        "transfer_event": transfer_event,
        "current_custodian": req.new_custodian_badge_id
    }

@router.get("/case/{case_id}")
async def api_get_case_evidence(case_id: str):
    """Returns all evidence items for a given case."""
    case_items = [v for k, v in IN_MEMORY_EVIDENCE.items() if v.get("case_id") == case_id or case_id == "all"]
    return {
        "count": len(case_items),
        "evidence_items": case_items
    }

@router.get("/{barcode_id}")
async def api_get_evidence_by_barcode(barcode_id: str):
    """Retrieves full chain of custody timeline by evidence barcode."""
    item = IN_MEMORY_EVIDENCE.get(barcode_id)
    if not item:
        raise HTTPException(status_code=404, detail="Evidence barcode item not found.")
    return item
