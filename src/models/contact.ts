export interface Contact {
  id: number;
  name: string;
  firm?: string;

  email?: string;
  phone?: string;

  role?: string;        // agent, landlord, asset manager
  notes?: string;

  created_at?: string;
}
