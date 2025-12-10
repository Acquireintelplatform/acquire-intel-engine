import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";

export default function ScraperStatusView() {
  return (
    <>
      <Card>
        <SectionTitle>Scraper Status (Coming Soon)</SectionTitle>
        <p style={{ color: "#CFE8F3" }}>
          Live overview of scraper runs, errors, uptime logs, and portal connectivity.
        </p>
      </Card>
    </>
  );
}
