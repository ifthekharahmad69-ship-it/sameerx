import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.blockchain import (
    calculate_sha256,
    anchor_document_hash,
    verify_document_integrity,
    get_ledger_history
)

def test_sha256_calculation():
    text = "FIR No 0123/2025 State vs Rahul Kumar"
    h1 = calculate_sha256(text)
    h2 = calculate_sha256(text)
    assert h1 == h2
    assert len(h1) == 64

def test_block_anchoring_and_verification():
    doc_id = "DOC-TEST-FIR-101"
    content = "Original FIR details with zero modifications."

    # Anchor
    res = anchor_document_hash(document_id=doc_id, content=content, actor_badge_id="IO-9900")
    assert res["success"] is True
    assert res["status"] == "ANCHORED_AND_VERIFIED"
    assert "blockchain_tx_id" in res
    assert res["block_number"] > 0

    # Verify original content
    ver = verify_document_integrity(document_id=doc_id, content=content)
    assert ver["verified"] is True
    assert ver["status"] == "TAMPER_FREE_VERIFIED"
    assert ver["certificate_id"] is not None

def test_tamper_detection():
    doc_id = "DOC-TEST-TAMPER-202"
    original_content = "Accused Rahul Kumar was arrested on 12th May 2025 at 10 PM."
    tampered_content = "Accused Rahul Kumar was arrested on 14th May 2025 at 10 PM." # 1 character change

    # Anchor original
    anchor_document_hash(document_id=doc_id, content=original_content, actor_badge_id="IO-9900")

    # Verify tampered content
    ver = verify_document_integrity(document_id=doc_id, content=tampered_content)
    assert ver["verified"] is False
    assert ver["status"] == "TAMPERING_DETECTED"
    assert ver["calculated_hash"] != ver["anchored_hash"]

if __name__ == "__main__":
    test_sha256_calculation()
    test_block_anchoring_and_verification()
    test_tamper_detection()
    print("ALL BLOCKCHAIN TESTS PASSED")
