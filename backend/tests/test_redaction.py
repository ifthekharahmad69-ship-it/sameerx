import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.redaction import detect_and_redact_pii

def test_pii_auto_redaction():
    sample_text = (
        "Statement of victim Smt. Priya Sharma, aged 17 years, residing at "
        "H.No 42, Jubilee Hills, Hyderabad. Phone: 9876543210, Aadhaar: 1234-5678-9012. "
        "Case filed under Section 4 POCSO Act and BNS Section 73."
    )

    res = detect_and_redact_pii(text=sample_text, document_id="TEST-RED-001")
    assert res["success"] is True
    assert res["pii_count"] > 0
    assert "Priya Sharma" not in res["redacted_text"]
    assert "9876543210" not in res["redacted_text"]
    assert res["compliance"]["bns_section_73"] == "COMPLIANT"

if __name__ == "__main__":
    test_pii_auto_redaction()
    print("ALL REDACTION TESTS PASSED")
