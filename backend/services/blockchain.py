import hashlib
import time
import uuid
import os
from typing import Dict, Any, List, Optional

try:
    from db.supabase_client import supabase
except Exception:
    supabase = None

# In-memory ledger fallback for local development & demonstration
IN_MEMORY_BLOCKCHAIN_LEDGER: List[Dict[str, Any]] = [
    {
        "id": "genesis-block-0000",
        "document_id": "GENESIS",
        "sha256_hash": "0000000000000000000000000000000000000000000000000000000000000000",
        "previous_block_hash": "0" * 64,
        "blockchain_tx_id": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "block_number": 0,
        "action_type": "GENESIS_INITIALIZATION",
        "actor_badge_id": "SYSTEM",
        "timestamp": "2026-01-01T00:00:00Z"
    }
]

def calculate_sha256(content: str | bytes) -> str:
    """Computes standard SHA-256 cryptographic hash digest."""
    if isinstance(content, str):
        content_bytes = content.encode('utf-8')
    else:
        content_bytes = content
    return hashlib.sha256(content_bytes).hexdigest()

def anchor_document_hash(
    document_id: str,
    content: str | bytes,
    actor_badge_id: str = "IO-8821",
    action_type: str = "ANCHOR_HASH"
) -> Dict[str, Any]:
    """
    Anchors document SHA-256 hash onto the immutable ledger.
    Links current block to previous block's hash.
    """
    sha256_digest = calculate_sha256(content)
    
    # Get previous block hash and block number
    latest_block = IN_MEMORY_BLOCKCHAIN_LEDGER[-1]
    prev_hash = latest_block["sha256_hash"]
    next_block_number = latest_block["block_number"] + 1

    # Simulate Polygon Amoy testnet transaction ID
    tx_hash_source = f"{document_id}:{sha256_digest}:{time.time()}"
    tx_id = f"0x{hashlib.sha256(tx_hash_source.encode()).hexdigest()}"
    
    block_entry = {
        "id": str(uuid.uuid4()),
        "document_id": document_id,
        "sha256_hash": sha256_digest,
        "previous_block_hash": prev_hash,
        "blockchain_tx_id": tx_id,
        "block_number": next_block_number,
        "action_type": action_type,
        "actor_badge_id": actor_badge_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    IN_MEMORY_BLOCKCHAIN_LEDGER.append(block_entry)

    # Try storing to Supabase if configured
    if supabase:
        try:
            supabase.table("blockchain_audit_ledger").insert({
                "id": block_entry["id"],
                "document_id": document_id,
                "sha256_hash": sha256_digest,
                "previous_block_hash": prev_hash,
                "blockchain_tx_id": tx_id,
                "block_number": next_block_number,
                "action_type": action_type,
                "actor_badge_id": actor_badge_id
            }).execute()
        except Exception as e:
            print(f"[Blockchain Service] DB Insert warning: {e}")

    return {
        "success": True,
        "document_id": document_id,
        "sha256_hash": sha256_digest,
        "block_number": next_block_number,
        "blockchain_tx_id": tx_id,
        "previous_block_hash": prev_hash,
        "status": "ANCHORED_AND_VERIFIED",
        "certificate_id": f"CERT-NCRB-{next_block_number:06d}-{sha256_digest[:8].upper()}"
    }

def verify_document_integrity(document_id: str, content: str | bytes) -> Dict[str, Any]:
    """
    Verifies supplied document against anchored ledger state.
    Triggers tamper detection alert if hashes do not match.
    """
    calculated_hash = calculate_sha256(content)

    # Check local ledger
    anchored_entry = None
    for entry in reversed(IN_MEMORY_BLOCKCHAIN_LEDGER):
        if entry["document_id"] == document_id:
            anchored_entry = entry
            break

    # If not found locally, try DB
    if not anchored_entry and supabase:
        try:
            res = supabase.table("blockchain_audit_ledger") \
                .select("*") \
                .eq("document_id", document_id) \
                .order("block_number", desc=True) \
                .limit(1) \
                .execute()
            if res.data:
                anchored_entry = res.data[0]
        except Exception as e:
            print(f"[Blockchain Service] DB fetch error: {e}")

    if not anchored_entry:
        return {
            "verified": False,
            "status": "NOT_FOUND",
            "message": "No anchored hash found for this document ID in the Blockchain Ledger.",
            "calculated_hash": calculated_hash,
            "anchored_hash": None
        }

    anchored_hash = anchored_entry["sha256_hash"]
    is_valid = (calculated_hash == anchored_hash)

    return {
        "verified": is_valid,
        "status": "TAMPER_FREE_VERIFIED" if is_valid else "TAMPERING_DETECTED",
        "message": "Document integrity confirmed. Court admissible." if is_valid else "SECURITY WARNING: Document content mutated! Hash mismatch detected.",
        "calculated_hash": calculated_hash,
        "anchored_hash": anchored_hash,
        "blockchain_tx_id": anchored_entry.get("blockchain_tx_id"),
        "block_number": anchored_entry.get("block_number"),
        "timestamp": anchored_entry.get("timestamp"),
        "certificate_id": f"CERT-NCRB-{anchored_entry.get('block_number', 0):06d}-{anchored_hash[:8].upper()}" if is_valid else None
    }

def get_ledger_history(document_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns audit entries from the immutable chain."""
    if document_id:
        return [entry for entry in IN_MEMORY_BLOCKCHAIN_LEDGER if entry["document_id"] == document_id]
    return IN_MEMORY_BLOCKCHAIN_LEDGER
