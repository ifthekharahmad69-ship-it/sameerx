import React, { useState } from 'react';
import {
  EyeOff,
  Eye,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Download,
  Lock,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';

const SAMPLE_CASE_TEXT = 
  "STATEMENT OF VICTIM / SURVIVOR UNDER SECTION 183 BNSS (164 CrPC)\n" +
  "Police Station: Women Protection Cell, NCRB Station #2\n" +
  "Case Ref: FIR 0492/2025 | Offence: Section 64, 70 BNS / Section 4 POCSO Act\n\n" +
  "Statement recorded of victim Smt. Sunita Sharma, aged 16 years (minor), " +
  "daughter of Shri Ramakant Sharma, residing at House No. 84, Sector 4, RK Puram, New Delhi.\n" +
  "Contact Mobile: 9811223344 | Aadhaar: 4920-1182-9931.\n\n" +
  "The victim states that on 10th May 2025 at approximately 21:00 Hours, while returning home from " +
  "tuition classes near Sector 4 Market, accused Vikram Singh intercepted her vehicle and threatened her.\n" +
  "Investigating Officer: IO-WOMEN-SAFETY-402 | FSL Token: FSL-DEL-9012";

export default function RedactionStudio() {
  const [inputText, setInputText] = useState(SAMPLE_CASE_TEXT);
  const [redactNames, setRedactNames] = useState(true);
  const [redactContact, setRedactContact] = useState(true);
  const [redactAddress, setRedactAddress] = useState(true);
  const [redactMinor, setRedactMinor] = useState(true);

  // Compute live redaction
  const getRedactedOutput = () => {
    let result = inputText;
    const detectedList = [];

    if (redactNames) {
      const names = ["Smt. Sunita Sharma", "Sunita Sharma", "Ramakant Sharma"];
      names.forEach(n => {
        if (result.includes(n)) {
          detectedList.push({ type: "Survivor Identity", val: n, mask: "[REDACTED SURVIVOR NAME - BNS SEC 73]" });
          result = result.replaceAll(n, "[REDACTED SURVIVOR NAME - BNS SEC 73]");
        }
      });
    }

    if (redactContact) {
      const contacts = ["9811223344", "4920-1182-9931"];
      contacts.forEach(c => {
        if (result.includes(c)) {
          detectedList.push({ type: "PII Contact/Aadhaar", val: c, mask: "[REDACTED PII - PRIVACY DIRECTIVE]" });
          result = result.replaceAll(c, "[REDACTED PII - PRIVACY DIRECTIVE]");
        }
      });
    }

    if (redactAddress) {
      const addr = "House No. 84, Sector 4, RK Puram, New Delhi";
      if (result.includes(addr)) {
        detectedList.push({ type: "Residential Address", val: addr, mask: "[REDACTED SURVIVOR LOCATION - NCRB SAFEGUARD]" });
        result = result.replaceAll(addr, "[REDACTED SURVIVOR LOCATION - NCRB SAFEGUARD]");
      }
    }

    if (redactMinor) {
      const minorStr = "aged 16 years (minor)";
      if (result.includes(minorStr)) {
        detectedList.push({ type: "Minor Age / POCSO", val: minorStr, mask: "[REDACTED MINOR AGE - POCSO ACT]" });
        result = result.replaceAll(minorStr, "[REDACTED MINOR AGE - POCSO ACT]");
      }
    }

    return { redactedText: result, detectedList };
  };

  const { redactedText, detectedList } = getRedactedOutput();
  const [copied, setCopied] = useState(false);

  const handleCopyRedacted = () => {
    navigator.clipboard.writeText(redactedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1280px", margin: "0 auto", color: "var(--text-main)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(31, 26, 44, 0.95), rgba(48, 38, 70, 0.95))",
        borderRadius: "16px",
        padding: "24px 30px",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #a855f7, #7e22ce)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(168, 85, 247, 0.4)"
          }}>
            <EyeOff size={28} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 className="serif" style={{ fontSize: "22px", color: "#ffffff", fontWeight: 700, margin: 0 }}>
                NCRB Survivor Identity Auto-Redaction Studio
              </h2>
              <span style={{
                background: "rgba(168, 85, 247, 0.25)",
                color: "#e9d5ff",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                border: "1px solid rgba(168, 85, 247, 0.4)"
              }}>
                Women Safety Division
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", margin: "4px 0 0 0" }}>
              Automated PII Masking under Bharatiya Nyaya Sanhita (BNS) Sec 73 & POCSO Act Identity Mandates
            </p>
          </div>
        </div>

        {/* Compliance Badges */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            borderRadius: "8px",
            padding: "8px 14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "10px", color: "#6ee7b7", textTransform: "uppercase", fontWeight: 700 }}>Statutory Rule</div>
            <div style={{ fontSize: "12.5px", color: "#ffffff", fontWeight: 700, marginTop: "1px" }}>BNS Section 73</div>
          </div>
          <div style={{
            background: "rgba(212, 175, 55, 0.15)",
            border: "1px solid var(--gold)",
            borderRadius: "8px",
            padding: "8px 14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "10px", color: "var(--gold-light)", textTransform: "uppercase", fontWeight: 700 }}>Child Protection</div>
            <div style={{ fontSize: "12.5px", color: "#ffffff", fontWeight: 700, marginTop: "1px" }}>POCSO Compliant</div>
          </div>
        </div>
      </div>

      {/* Control Toggles */}
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13.5px" }}>
          <Sliders size={16} color="var(--primary)" />
          PII Auto-Detection Filters:
        </div>

        <div style={{ display: "flex", gap: "18px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={redactNames}
              onChange={(e) => setRedactNames(e.target.checked)}
              style={{ accentColor: "#a855f7", width: "15px", height: "15px" }}
            />
            <span>Survivor/Victim Names (BNS 73)</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={redactContact}
              onChange={(e) => setRedactContact(e.target.checked)}
              style={{ accentColor: "#a855f7", width: "15px", height: "15px" }}
            />
            <span>Phone & Aadhaar PII</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={redactAddress}
              onChange={(e) => setRedactAddress(e.target.checked)}
              style={{ accentColor: "#a855f7", width: "15px", height: "15px" }}
            />
            <span>Residential Address & Location</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={redactMinor}
              onChange={(e) => setRedactMinor(e.target.checked)}
              style={{ accentColor: "#a855f7", width: "15px", height: "15px" }}
            />
            <span>Minor Age / POCSO Indicators</span>
          </label>
        </div>
      </div>

      {/* Side-by-side Viewers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Left: Original Investigation Document */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "20px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 className="serif" style={{ fontSize: "15px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Eye size={16} color="var(--primary)" />
              Original IO Confidential Statement
            </h3>
            <span style={{ fontSize: "11px", background: "rgba(225, 29, 72, 0.1)", color: "#e11d48", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
              RESTRICTED ACCESS (POLICE / JUDGE ONLY)
            </span>
          </div>

          <textarea
            rows={14}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-app)",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: "1.6",
              color: "var(--text-main)",
              resize: "vertical"
            }}
          />
        </div>

        {/* Right: Redacted Public / Defense Copy */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "20px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 className="serif" style={{ fontSize: "15px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} color="#a855f7" />
              Redacted Public / Defense Copy
            </h3>
            <button
              onClick={handleCopyRedacted}
              style={{
                background: "rgba(168, 85, 247, 0.1)",
                color: "#a855f7",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Download size={13} />}
              <span>{copied ? "Copied!" : "Export Redacted Text"}</span>
            </button>
          </div>

          <div style={{
            width: "100%",
            minHeight: "260px",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            background: "rgba(24, 18, 36, 0.95)",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.6",
            color: "#e2e8f0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {redactedText}
          </div>

          {/* Redaction Audit Summary */}
          <div style={{ marginTop: "16px", background: "var(--bg-app)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} color="#a855f7" />
              Detected & Redacted Entities ({detectedList.length})
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {detectedList.map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px",
                    background: "rgba(168, 85, 247, 0.15)",
                    color: "#c084fc",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontWeight: 600
                  }}
                >
                  {item.type}: {item.val}
                </span>
              ))}
              {detectedList.length === 0 && (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)", italic: "true" }}>
                  No active PII masks selected.
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
