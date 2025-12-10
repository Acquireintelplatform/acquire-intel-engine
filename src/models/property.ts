export interface Property {
  id: number;
  building?: string;
  street?: string;
  town?: string;
  postcode?: string;

  latitude?: number;
  longitude?: number;

  size_sqft?: number;
  use_class?: string;

  rent_per_annum?: number;
  tenure?: string;

  source_portal?: string;
  listing_url?: string;

  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;

  available_from?: string | null;
  lease_expiry?: string | null;

  created_at?: string;
}
