export interface ScrapeJob {
  id: number;
  portal: string;
  status: "pending" | "running" | "success" | "failed";
  started_at?: string;
  finished_at?: string;
  message?: string;
}
