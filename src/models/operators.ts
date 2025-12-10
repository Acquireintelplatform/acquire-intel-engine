export interface Operator {
  id: number;
  name: string;
  category?: string;          // grocery, QSR, casual dining, gym, etc.
  format?: string;            // high street, retail park, drive-thru, etc.

  min_sqft?: number;
  max_sqft?: number;

  rent_min?: number;
  rent_max?: number;

  preferred_locations?: string;   // free text or CSV string
  notes?: string;

  created_at?: string;
}
