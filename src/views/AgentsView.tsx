// src/views/AgentsView.tsx

import React, { useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";

type AgentTag = string;

interface Agent {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  tags: AgentTag[];
  notes: string;
  createdAt: string; // ISO string
}

export default function AgentsView() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);

  const handleAddAgent = () => {
    if (!name.trim() && !company.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newAgent: Agent = {
      id: Date.now(),
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      tags,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setAgents((prev) => [newAgent, ...prev]);

    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setTagsInput("");
    setNotes("");
  };

  const handleClearForm = () => {
    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setTagsInput("");
    setNotes("");
  };

  const filteredAgents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const tag = tagFilter.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesSearch =
        !term ||
        agent.name.toLowerCase().includes(term) ||
        agent.company.toLowerCase().includes(term) ||
        agent.email.toLowerCase().includes(term) ||
        agent.phone.toLowerCase().includes(term) ||
        agent.notes.toLowerCase().includes(term);

      const matchesTag =
        !tag || agent.tags.some((t) => t.toLowerCase().includes(tag));

      return matchesSearch && matchesTag;
    });
  }, [agents, searchTerm, tagFilter]);

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
    gap: "1.5rem",
    alignItems: "flex-start",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#8FA3B8",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#020813",
    border: "1px solid #1b2d3f",
    borderRadius: "0.5rem",
    padding: "0.55rem 0.75rem",
    color: "#E5EDF7",
    fontSize: "0.9rem",
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "110px",
    resize: "vertical" as const,
  };

  const primaryButtonStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, #2EF2D0 0%, #0bc9a5 50%, #2EF2D0 100%)",
    border: "none",
    borderRadius: "999px",
    padding: "0.55rem 1.3rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "#031321",
    boxShadow: "0 0 18px rgba(46, 242, 208, 0.35)",
    whiteSpace: "nowrap",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#020813",
    border: "1px solid #213952",
    borderRadius: "999px",
    padding: "0.55rem 1.1rem",
    fontSize: "0.8rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    color: "#9FB3C8",
    whiteSpace: "nowrap",
  };

  const aiButtonStyle: React.CSSProperties = {
    ...secondaryButtonStyle,
    borderColor: "#2EF2D0",
    color: "#2EF2D0",
    boxShadow: "0 0 14px rgba(46, 242, 208, 0.25)",
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.15rem 0.6rem",
    borderRadius: "999px",
    border: "1px solid rgba(46, 242, 208, 0.4)",
    background:
      "radial-gradient(circle at 0% 0%, rgba(46, 242, 208, 0.18), transparent 60%)",
    color: "#B9F7EC",
    fontSize: "0.7rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    marginRight: "0.25rem",
    marginBottom: "0.25rem",
    whiteSpace: "nowrap",
  };

  const tableWrapperStyle: React.CSSProperties = {
    borderRadius: "0.75rem",
    border: "1px solid #1b2d3f",
    overflow: "hidden",
    boxShadow: "0 0 24px rgba(0, 0, 0, 0.7)",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left" as const,
    padding: "0.7rem 0.8rem",
    backgroundColor: "#020813",
    borderBottom: "1px solid #1b2d3f",
    color: "#9FB3C8",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.65rem 0.8rem",
    borderBottom: "1px solid #101827",
    color: "#E5EDF7",
    verticalAlign: "top" as const,
  };

  const subtleTextStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "#7D8FA5",
  };

  return (
    <PageWrapper>
      <SectionTitle>Agents & Landlords</SectionTitle>

      <Card>
        <div style={sectionHeaderStyle}>
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#7D8FA5",
                marginBottom: "0.15rem",
              }}
            >
              CONTACT INTELLIGENCE
            </div>
            <div
              style={{
                fontSize: "0.95rem",
                color: "#E5EDF7",
              }}
            >
              Log every agent, protect every negotiation, remember every red
              flag.
            </div>
          </div>

          <button
            style={aiButtonStyle}
            type="button"
            onClick={() => {
              alert("AI Agent Intel coming soon.");
            }}
          >
            AI Agent Intel
          </button>
        </div>

        <div style={containerStyle}>
          {/* LEFT: Add / edit agent */}
          <div>
            <div
              style={{
                marginBottom: "0.9rem",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#7D8FA5",
              }}
            >
              Add Agent / Landlord
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.9rem 1rem",
                marginBottom: "0.85rem",
              }}
            >
              <label style={labelStyle}>
                Name
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Joss Smith"
                />
              </label>

              <label style={labelStyle}>
                Company
                <input
                  style={inputStyle}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. XYZ Retail Agency"
                />
              </label>

              <label style={labelStyle}>
                Phone
                <input
                  style={inputStyle}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7..."
                />
              </label>

              <label style={labelStyle}>
                Email
                <input
                  style={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@agency.co.uk"
                />
              </label>

              <label style={labelStyle}>
                Tags
                <input
                  style={inputStyle}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder='e.g. "slow responder, favours landlord"'
                />
              </label>

              <div />
            </div>

            <label style={labelStyle}>
              Internal Notes
              <textarea
                style={textareaStyle}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Negotiation history, good/bad experiences, fee stance, etc."
              />
            </label>

            <div
              style={{
                display: "flex",
                gap: "0.65rem",
                marginTop: "0.95rem",
              }}
            >
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleAddAgent}
              >
                Save Agent
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={handleClearForm}
              >
                Clear
              </button>
            </div>
          </div>

          {/* RIGHT: Search, filters, table */}
          <div>
            <div style={sectionHeaderStyle}>
              <div
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#7D8FA5",
                }}
              >
                Agent / Landlord Directory
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                marginBottom: "0.8rem",
              }}
            >
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, company, phone, email or notes..."
              />
              <input
                style={{ ...inputStyle, width: "210px" }}
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Filter by tag..."
              />
            </div>

            <div style={subtleTextStyle}>
              {filteredAgents.length === 0
                ? "No agents logged yet. Add your first contact on the left."
                : `${filteredAgents.length} contact${
                    filteredAgents.length === 1 ? "" : "s"
                  } visible.`}
            </div>

            <div style={{ marginTop: "0.7rem" }}>
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Agent</th>
                      <th style={thStyle}>Contact</th>
                      <th style={thStyle}>Tags</th>
                      <th style={thStyle}>Notes</th>
                      <th style={thStyle}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td style={tdStyle}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.86rem",
                              color: "#F3F7FF",
                              marginBottom: "0.1rem",
                            }}
                          >
                            {agent.name || "—"}
                          </div>
                          <div style={subtleTextStyle}>
                            {agent.company || "—"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={subtleTextStyle}>
                            {agent.phone || "—"}
                          </div>
                          <div style={subtleTextStyle}>
                            {agent.email || "—"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {agent.tags.length === 0 ? (
                            <span style={subtleTextStyle}>No tags</span>
                          ) : (
                            agent.tags.map((t, idx) => (
                              <span key={idx} style={badgeStyle}>
                                {t}
                              </span>
                            ))
                          )}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              ...subtleTextStyle,
                              maxWidth: "260px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {agent.notes || "—"}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={subtleTextStyle}>
                            {new Date(agent.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div style={subtleTextStyle}>
                            {new Date(agent.createdAt).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
