import React, { useEffect, useState, FormEvent } from "react";
import OperatorService from "../services/OperatorService";
import "./OperatorManagementView.css";

interface Operator {
  id: number;
  name: string;
  segment?: string | null;
  website?: string | null;
  notes?: string | null;
}

const OperatorManagementView: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Normalise API response into an array
  const normaliseOperators = (data: any): Operator[] => {
    if (Array.isArray(data)) return data as Operator[];
    if (Array.isArray(data?.operators)) return data.operators as Operator[];
    return [];
  };

  const loadOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await OperatorService.fetchOperators();
      setOperators(normaliseOperators(data));
    } catch (err: any) {
      console.error("Failed to load operators:", err);
      setError("Failed to load operators.");
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Please enter an operator name.");
      return;
    }

    try {
      setSaving(true);

      await OperatorService.createOperator({
        name: name.trim(),
        segment: segment.trim() || null,
        website: website.trim() || null,
        notes: notes.trim() || null,
      });

      setSuccess("Operator added successfully.");
      setName("");
      setSegment("");
      setWebsite("");
      setNotes("");

      await loadOperators();
    } catch (err: any) {
      console.error("Failed to create operator:", err);
      setError("Failed to add operator.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-management-page">
      <div className="operator-management-card">
        <h1 className="page-title">Operator Management</h1>

        <form className="operator-form" onSubmit={handleSubmit}>
          <label className="form-label">
            Operator Name
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Test Operator 1"
            />
          </label>

          <label className="form-label">
            Segment / Format
            <input
              className="form-input"
              type="text"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="e.g. QSR, casual dining, grocery"
            />
          </label>

          <label className="form-label">
            Website (optional)
            <input
              className="form-input"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label className="form-label">
            Notes (optional)
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this operator."
            />
          </label>

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add Operator"}
          </button>

          {error && <div className="status-message error">{error}</div>}
          {success && <div className="status-message success">{success}</div>}
        </form>
      </div>

      <div className="operator-list-card">
        <h2 className="section-title">Existing Operators</h2>

        {loading ? (
          <div className="muted-text">Loading operators…</div>
        ) : operators.length === 0 ? (
          <div className="muted-text">No operators found.</div>
        ) : (
          <ul className="operator-list">
            {operators.map((op) => (
              <li key={op.id} className="operator-list-item">
                <div className="operator-name">{op.name}</div>
                {op.segment && (
                  <div className="operator-meta">Segment: {op.segment}</div>
                )}
                {op.website && (
                  <div className="operator-meta">
                    Website:{" "}
                    <a
                      href={op.website}
                      target="_blank"
                      rel="noreferrer"
                      className="operator-link"
                    >
                      {op.website}
                    </a>
                  </div>
                )}
                {op.notes && (
                  <div className="operator-meta">Notes: {op.notes}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OperatorManagementView;
