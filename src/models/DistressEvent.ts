export interface DistressEvent {
  id: number;
  company_name: string;
  company_number?: string;

  event_type: string;        // liquidation, CVA, admin, etc.
  source: string;            // Companies House, Gazette, BSR, etc.

  event_date: string;

  related_property?: string;
  related_operator?: string;

  created_at?: string;
}
