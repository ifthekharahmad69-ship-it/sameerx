import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Hash,
  Link as LinkIcon,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Award,
  RefreshCw,
  Copy,
  Check,
  Lock,
  FileText
} from 'lucide-react';

const MOCK_BLOCKS = [
  {
    block_number: 14082,
    document_id: "FIR-0123-2025",
    sha256_hash: "a3b8c9d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    previous_block_hash: "9f8e7d6c5b4a3210987654321fedcba987654321fedcba987654321fedcba98",
    blockchain_tx_id: "0x8f7d6e5c4b3a210987654321fedcba987654321098765432109876543210abcd",
    action_type: "ANCHOR_FIR_DOC",
    actor_badge_id: "IO-HYD-8821",
    timestamp: "2025-05-12 14:32:10 UTC"
  },
  {
    block_number: 14083,
    document_id: "FSL-REPORT-9942",
    sha256_hash: "5e4d3c2b1a0987654321fedcba98765432109876543210987654321098765432",
    previous_block_hash: "a3b8c9d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    blockchain_tx_id: "0x1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef0",
    action_type: "ANCHOR_FORENSIC_SPECTRUM",
    actor_badge_id: "FSL-EXP-402",
    timestamp: "2025-05-14 09:15:44 UTC"
  }
];

export default function BlockchainVerifier() {
  const [docText, setDocText] = useState(
    "FIRST INFORMATION REPORT (Under Section 173 BNSS / 154 CrPC)\n" +
    "Police Station: Jubilee Hills, Cyberabad | FIR No: 0123/2025\n" +
    "Date & Time of Offence: 12-05-2025 at 22:30 Hours\n" +
    "Accused: Rahul Kumar s/o Ramesh Kumar\n" +
    "Offences Charged: Section 304, 323, 506 Bharatiya Nyaya Sanhita (BNS)\n" +
    "Investigating Officer Badge: IO-HYD-8821"
  );
  const [docId, setDocId] = useState("FIR-0123-2025");
  const [badgeId, setBadgeId] = useState("IO-HYD-8821");
  const [isTampered, setIsTampered] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [chain, setChain] = useState(MOCK_BLOCKS);
  const [copiedTx, setCopiedTx] = useState(null);

  // Compute live SHA-256 in browser
  const computeHash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAnchor = async () => {
    setIsVerifying(true);
    const currentHash = await computeHash(docText);
    const prevBlock = chain[chain.length - 1];
    const newBlockNumber = prevBlock ? prevBlock.block_number + 1 : 10001;
    const txId = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const newBlock = {
      block_number: newBlockNumber,
      document_id: docId,
      sha256_hash: currentHash,
      previous_block_hash: prevBlock ? prevBlock.sha256_hash : "0".repeat(64),
      blockchain_tx_id: txId,
      action_type: "ANCHOR_LEGAL_DOC",
      actor_badge_id: badgeId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };

    setTimeout(() => {
      setChain([...chain, newBlock]);
      setVerificationResult({
        verified: true,
        status: "ANCHORED_AND_VERIFIED",
        message: "Document hash anchored to Blockchain Immutable Ledger.",
        calculated_hash: currentHash,
        anchored_hash: currentHash,
        blockchain_tx_id: txId,
        block_number: newBlockNumber,
        certificate_id: `CERT-NCRB-${newBlockNumber}-${currentHash.substring(0, 8).toUpperCase()}`
      });
      setIsVerifying(false);
    }, 600);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    const currentHash = await computeHash(docText);
    
    // Find in chain
    const anchored = [...chain].reverse().find(b => b.document_id === docId);

    setTimeout(() => {
      if (!anchored) {
        setVerificationResult({
          verified: false,
          status: "NOT_FOUND",
          message: "No recorded anchor found for this Document ID in the audit chain.",
          calculated_hash: currentHash,
          anchored_hash: null
        });
      } else {
        const isValid = (currentHash === anchored.sha256_hash);
        setVerificationResult({
          verified: isValid,
          status: isValid ? "TAMPER_FREE_VERIFIED" : "TAMPERING_DETECTED",
          message: isValid
            ? "100% Cryptographic Match — Court Admissible & Evidence Intact."
            : "SECURITY ALERT: Document content mutated! Hash mismatch detected.",
          calculated_hash: currentHash,
          anchored_hash: anchored.sha256_hash,
          blockchain_tx_id: anchored.blockchain_tx_id,
          block_number: anchored.block_number,
          certificate_id: isValid ? `CERT-NCRB-${anchored.block_number}-${anchored.sha256_hash.substring(0, 8).toUpperCase()}` : null
        });
      }
      setIsVerifying(false);
    }, 500);
  };

  const simulateTamper = () => {
    setDocText((prev) => prev + " [MODIFIED: Bail granted without court approval]");
    setIsTampered(true);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1280px", margin: "0 auto", color: "var(--text-main)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 37, 33, 0.95), rgba(28, 59, 50, 0.95))",
        borderRadius: "16px",
        padding: "24px 30px",
        border: "1px solid rgba(212, 175, 55, 0.3)",
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
            background: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.4)"
          }}>
            <ShieldCheck size={30} color="#12241f" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 className="serif" style={{ fontSize: "22px", color: "#ffffff", fontWeight: 700, margin: 0 }}>
                Blockchain Document Integrity Ledger
              </h2>
              <span style={{
                background: "rgba(212, 175, 55, 0.2)",
                color: "#e2b857",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                border: "1px solid rgba(212, 175, 55, 0.4)"
              }}>
                SIH 2026 PS 26190
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", margin: "4px 0 0 0" }}>
              Immutable SHA-256 Cryptographic Audit Chain for FIRs, Forensic Reports & Charge Sheets (NCRB / MHA Standards)
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right", color: "rgba(255,255,255,0.85)" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold-light)" }}>
            Ledger Status
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            Polygon Testnet Synced
          </div>
        </div>
      </div>

      {/* Main Grid: Workspace & Chain Explorer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Left Column: Interactive Document & Hash Verification */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 className="serif" style={{ fontSize: "17px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} color="var(--primary)" />
              Document Evidence Vault
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Anchor & Verify
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Document Reference ID
              </label>
              <input
                type="text"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-app)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                IO / Officer Badge ID
              </label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-app)",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {/* Document Content Textarea */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>
                Legal Document Raw Content / FIR Transcript:
              </label>
              <button
                onClick={simulateTamper}
                style={{
                  background: "rgba(225, 29, 72, 0.1)",
                  color: "#e11d48",
                  border: "1px solid rgba(225, 29, 72, 0.3)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ⚡ Simulate Tamper Mutation
              </button>
            </div>
            <textarea
              rows={8}
              value={docText}
              onChange={(e) => {
                setDocText(e.target.value);
                setVerificationResult(null);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: isTampered ? "2px solid #e11d48" : "1px solid var(--border-color)",
                background: "var(--bg-app)",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "var(--text-main)",
                resize: "vertical"
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={handleAnchor}
              disabled={isVerifying}
              className="btn-primary"
              style={{ flex: 1, padding: "10px", justifyContent: "center" }}
            >
              <Lock size={15} />
              <span>Anchor SHA-256 Hash</span>
            </button>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--primary)",
                background: "transparent",
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer"
              }}
            >
              <ShieldCheck size={15} />
              <span>Verify Integrity</span>
            </button>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div style={{
              borderRadius: "10px",
              padding: "16px",
              background: verificationResult.verified ? "rgba(16, 185, 129, 0.1)" : "rgba(225, 29, 72, 0.1)",
              border: `1px solid ${verificationResult.verified ? "#10b981" : "#e11d48"}`,
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {verificationResult.verified ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : (
                  <AlertTriangle size={22} color="#e11d48" />
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: verificationResult.verified ? "#065f46" : "#9f1239" }}>
                    {verificationResult.status}
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-main)" }}>
                    {verificationResult.message}
                  </p>
                </div>
              </div>

              {verificationResult.certificate_id && (
                <div style={{
                  background: "var(--bg-card)",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px dashed #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Award size={16} color="var(--gold)" />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
                      {verificationResult.certificate_id}
                    </span>
                  </div>
                  <span style={{ fontSize: "10.5px", background: "var(--gold-light)", color: "#12241f", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    COURT ADMISSIBLE SEC. 65B
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Immutable Audit Ledger Explorer */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "24px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 className="serif" style={{ fontSize: "17px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Hash size={18} color="var(--gold)" />
              Immutable Audit Ledger
            </h3>
            <span style={{ fontSize: "11px", background: "rgba(16, 185, 129, 0.15)", color: "#059669", padding: "3px 8px", borderRadius: "12px", fontWeight: 700 }}>
              {chain.length} Blocks Anchored
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "540px", paddingRight: "4px" }}>
            {chain.slice().reverse().map((block, idx) => (
              <div
                key={block.block_number}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "14px",
                  background: idx === 0 ? "rgba(212, 175, 55, 0.05)" : "var(--bg-app)",
                  borderLeft: `4px solid ${idx === 0 ? "var(--gold)" : "var(--primary)"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={12} color="var(--gold)" /> Block #{block.block_number}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {block.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: "11.5px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Doc Ref:</span>
                    <strong style={{ color: "var(--text-main)" }}>{block.document_id}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Officer Badge:</span>
                    <span>{block.actor_badge_id}</span>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "10.5px" }}>SHA-256 Hash:</span>
                    <code style={{ fontSize: "10.5px", background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all", display: "block" }}>
                      {block.sha256_hash}
                    </code>
                  </div>

                  <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Polygon Tx:</span>
                    <button
                      onClick={() => copyToClipboard(block.blockchain_tx_id, block.block_number)}
                      style={{
                        background: "none", border: "none", color: "var(--primary)", fontSize: "10.5px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                      }}
                    >
                      {copiedTx === block.block_number ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      {block.blockchain_tx_id.substring(0, 14)}...
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
