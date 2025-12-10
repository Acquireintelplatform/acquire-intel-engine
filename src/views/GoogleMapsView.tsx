import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";

export default function GoogleMapsView() {
  return (
    <>
      <Card>
        <SectionTitle>Google Maps Engine</SectionTitle>
        <p style={{ color: "#CFE8F3", marginBottom: "12px" }}>
          Interactive map system for viewing property opportunities, operator locations, clusters, and insights.
        </p>
      </Card>

      <Card>
        <p style={{ color: "#CFE8F3" }}>
          (Map canvas will be added later. This is the styled placeholder version.)
        </p>
      </Card>
    </>
  );
}
