import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";

export default function DashboardView() {
  return (
    <>
      <Card>
        <SectionTitle>Welcome to the Acquire Commercial Intelligence Engine</SectionTitle>
        <p style={{ color: "#CFE8F3", lineHeight: "1.7", marginTop: "10px" }}>
          Your unified command centre for UK retail, F&amp;B, and leisure intelligence — integrating
          live property stock, operator movements, distress signals, and deal flow.
        </p>
      </Card>

      <Card>
        <SectionTitle>Live Market Signals (Coming Soon)</SectionTitle>
      </Card>

      <Card>
        <SectionTitle>Operator Movement Tracker (Coming Soon)</SectionTitle>
      </Card>

      <Card>
        <SectionTitle>Distress &amp; Risk Dashboard (Coming Soon)</SectionTitle>
      </Card>
    </>
  );
}
