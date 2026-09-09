import React, { useState } from 'react';
import {
  QrCode,
  Barcode,
  Package,
  ArrowRight,
  Shield,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
  MapPin,
  FileCheck
} from 'lucide-react';

const SAMPLE_EVIDENCE = [
  {
    barcode_id: "EVD-CRIM-2025-01",
    case_id: "m1 (State vs. Rahul Kumar)",
    evidence_type: "Seized Smartphone",
    description: "Samsung Galaxy S22 Ultra recovered from crime scene with blood specimen #2",
    custodian_badge_id: "IO-HYD-8821",
    seizure_location: "Banjara Hills Rd #12, Hyderabad",
    created_at: "2025-05-12 14:30 UTC",
    chain_of_custody: [
      {
        timestamp: "2025-05-12 14:30 UTC",
        custodian: "IO-HYD-8821 (Insp. Ramesh)",
        action: "SEIZURE_AND_BARCODING",
        location: "Police Station Malkhana",
        signature_hash: "0xa1b2c3d4e5f67890123456789abcdef012345678"
      },
      {
        timestamp: "2025-05-14 09:15 UTC",
        custodian: "FSL-EXP-402 (Dr. Ananya, Cyber Forensics)",
        action: "TRANSFERRED_TO_FORENSIC_LAB",
        location: "State Forensic Science Laboratory, TS",
        signature_hash: "0xf9e8d7c6b5a43210987654321fedcba987654321"
      }
    ]
  },
  {
    barcode_id: "EVD-CRIM-2025-02",
    case_id: "m1 (State vs. Rahul Kumar)",
    evidence_type: "Physical Document Specimen",
    description: "Original handwritten receipt with forged signature",
    custodian_badge_id: "FSL-DOC-309",
    seizure_location: "City Civil Court Storage",
    created_at: "2025-05-15 11:00 UTC",
    chain_of_custody: [
      {
        timestamp: "2025-05-15 11:00 UTC",
        custodian: "FSL-DOC-309 (Questioned Documents Unit)",
        action: "INITIAL_INGESTION",
        location: "Forensic Document Lab",
        signature_hash: "0x8765432109abcdef0123456789abcdef01234567"
      }
    ]
  }
];

export default function EvidenceBarcodeManager() {
  const [items, setItems] = useState(SAMPLE_EVIDENCE);
  const [selectedBarcode, setSelectedBarcode] = useState("EVD-CRIM-2025-01");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State for New Voucher Registration
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState("Seized Digital Device");
  const [newDesc, setNewDesc] = useState("");
  const [newBadge, setNewBadge] = useState("IO-HYD-8821");
  const [newLocation, setNewLocation] = useState("Jubilee Hills PS Malkhana");

  // Transfer Form State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newCustodian, setNewCustodian] = useState("PROSECUTOR-PUB-102");
  const [transferReason, setTransferReason] = useState("Handover for Court Evidence Presentation");
  const [transferLoc, setTransferLoc] = useState("Sessions Court Room #4");

  const selectedItem = items.find(i => i.barcode_id === selectedBarcode) || items[0];

  const handleRegisterNew = (e) => {
    e.preventDefault();
    const barcode = `EVD-CRIM-2025-${(items.length + 1).toString().padStart(2, '0')}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

    const newItem = {
      barcode_id: barcode,
      case_id: "m1 (State vs. Rahul Kumar)",
      evidence_type: newType,
      description: newDesc || "Physical evidence item seized during investigation",
      custodian_badge_id: newBadge,
      seizure_location: newLocation,
      created_at: timestamp,
      chain_of_custody: [
        {
          timestamp: timestamp,
          custodian: newBadge,
          action: "SEIZURE_AND_BARCODING",
          location: newLocation,
          signature_hash: "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
        }
      ]
    };

    setItems([newItem, ...items]);
    setSelectedBarcode(barcode);
    setShowAddModal(false);
    setNewDesc("");
  };

  const handleTransferCustody = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    const newEvent = {
      timestamp: timestamp,
      custodian: newCustodian,
      action: `CUSTODY_TRANSFER: ${transferReason}`,
      location: transferLoc,
      signature_hash: "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
    };

    const updatedItems = items.map(item => {
      if (item.barcode_id === selectedItem.barcode_id) {
        return {
          ...item,
          custodian_badge_id: newCustodian,
          chain_of_custody: [...item.chain_of_custody, newEvent]
        };
      }
      return item;
    });

    setItems(updatedItems);
    setShowTransferModal(false);
  };

  const filteredItems = items.filter(i => 
    i.barcode_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.evidence_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "28px", maxWidth: "1280px", margin: "0 auto", color: "var(--text-main)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 42, 35, 0.95), rgba(28, 70, 58, 0.95))",
        borderRadius: "16px",
        padding: "24px 30px",
        border: "1px solid rgba(16, 185, 129, 0.3)",
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
            background: "linear-gradient(135deg, #10b981, #047857)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
          }}>
            <QrCode size={28} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 className="serif" style={{ fontSize: "22px", color: "#ffffff", fontWeight: 700, margin: 0 }}>
                Physical Evidence Voucher & Barcode Manager
              </h2>
              <span style={{
                background: "rgba(16, 185, 129, 0.25)",
                color: "#6ee7b7",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.4)"
              }}>
                Chain of Custody
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", margin: "4px 0 0 0" }}>
              Multi-Agency Handover Audit for Police IOs, Forensic Labs, Prosecutors & Court Special Judges
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ padding: "10px 18px" }}
        >
          <Plus size={16} />
          <span>Register Evidence Item</span>
        </button>
      </div>

      {/* Main Grid: Item List & Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
        
        {/* Left Column: Barcode Search & Inventory */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: "14px",
          border: "1px solid var(--border-color)",
          padding: "20px",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Search Box */}
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "11px" }} />
            <input
              type="text"
              placeholder="Search Barcode or Evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-app)",
                fontSize: "12.5px"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "500px" }}>
            {filteredItems.map(item => (
              <div
                key={item.barcode_id}
                onClick={() => setSelectedBarcode(item.barcode_id)}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: item.barcode_id === selectedBarcode ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                  background: item.barcode_id === selectedBarcode ? "rgba(31, 61, 51, 0.08)" : "var(--bg-app)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--primary)", fontFamily: "monospace" }}>
                    {item.barcode_id}
                  </span>
                  <span style={{ fontSize: "10.5px", background: "var(--gold-light)", color: "#12241f", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    {item.evidence_type}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-main)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.description}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <UserCheck size={12} /> Custodian: {item.custodian_badge_id}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Evidence Detail & Chain-of-Custody Timeline */}
        {selectedItem && (
          <div style={{
            background: "var(--bg-card)",
            borderRadius: "14px",
            border: "1px solid var(--border-color)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {/* Voucher Header & QR Preview */}
            <div style={{
              background: "var(--bg-app)",
              borderRadius: "12px",
              padding: "20px",
              border: "1px dashed var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 className="serif" style={{ fontSize: "20px", margin: 0, fontWeight: 700, color: "var(--text-main)" }}>
                    Voucher #{selectedItem.barcode_id}
                  </h3>
                  <span style={{ fontSize: "11px", background: "#10b981", color: "#ffffff", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    CHAIN OF CUSTODY VERIFIED
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-main)", margin: "8px 0 4px 0", fontWeight: 600 }}>
                  {selectedItem.description}
                </p>

                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                  <span><MapPin size={13} style={{ verticalAlign: "middle" }} /> {selectedItem.seizure_location}</span>
                  <span><Clock size={13} style={{ verticalAlign: "middle" }} /> {selectedItem.created_at}</span>
                </div>
              </div>

              {/* QR Code Mock Voucher Card */}
              <div style={{
                background: "#ffffff",
                padding: "12px",
                borderRadius: "10px",
                border: "2px solid #000000",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
                <QrCode size={64} color="#000000" />
                <div style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: 700, color: "#000000", marginTop: "4px" }}>
                  {selectedItem.barcode_id}
                </div>
              </div>
            </div>

            {/* Transfer Custody Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 className="serif" style={{ fontSize: "16px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="var(--primary)" />
                Chain of Custody Transfer History
              </h4>

              <button
                onClick={() => setShowTransferModal(true)}
                style={{
                  background: "var(--primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <ArrowRight size={14} />
                <span>Handover / Transfer Custody</span>
              </button>
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", paddingLeft: "20px" }}>
              {/* Vertical line connecting timeline */}
              <div style={{
                position: "absolute",
                left: "7px",
                top: "10px",
                bottom: "10px",
                width: "2px",
                background: "var(--border-color)"
              }} />

              {selectedItem.chain_of_custody.map((event, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {/* Circle marker */}
                  <div style={{
                    position: "absolute",
                    left: "-20px",
                    top: "4px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: idx === selectedItem.chain_of_custody.length - 1 ? "#10b981" : "var(--primary)",
                    border: "3px solid var(--bg-card)"
                  }} />

                  <div style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
                        {event.action}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {event.timestamp}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-main)", display: "flex", gap: "16px" }}>
                      <span><strong>Custodian:</strong> {event.custodian}</span>
                      <span><strong>Location:</strong> {event.location}</span>
                    </div>

                    <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Signature Hash: <code style={{ background: "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: "3px" }}>{event.signature_hash}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Register Evidence Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-color)",
            padding: "24px", width: "480px", maxWidth: "90%"
          }}>
            <h3 className="serif" style={{ fontSize: "18px", margin: "0 0 16px 0", color: "var(--text-main)" }}>
              Register Physical Evidence Voucher
            </h3>
            <form onSubmit={handleRegisterNew} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Evidence Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                >
                  <option value="Seized Digital Device">Seized Digital Device / Mobile / Laptop</option>
                  <option value="Forensic Science Specimen">Forensic Science Specimen / DNA</option>
                  <option value="Seized Weapon / Contraband">Seized Weapon / Contraband</option>
                  <option value="Questioned Document Original">Questioned Document Original</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 14 Pro with cracked screen recovered from room #12"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Seizure Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Initial Custodian Badge ID</label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>Register Voucher</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "transparent", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Custody Modal */}
      {showTransferModal && selectedItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-color)",
            padding: "24px", width: "480px", maxWidth: "90%"
          }}>
            <h3 className="serif" style={{ fontSize: "18px", margin: "0 0 16px 0", color: "var(--text-main)" }}>
              Handover Custody: {selectedItem.barcode_id}
            </h3>
            <form onSubmit={handleTransferCustody} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>New Custodian Badge ID / Agency</label>
                <input
                  type="text"
                  value={newCustodian}
                  onChange={(e) => setNewCustodian(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Handover Reason / Purpose</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Transfer Location</label>
                <input
                  type="text"
                  value={transferLoc}
                  onChange={(e) => setTransferLoc(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-app)", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>Confirm Transfer</button>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "transparent", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
