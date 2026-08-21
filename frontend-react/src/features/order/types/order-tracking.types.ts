export interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  actorId: number | null;
  actorType: 'SYSTEM' | 'CUSTOMER' | 'SELLER' | 'SHIPPER' | 'ADMIN';
  actorName: string | null;
  note: string | null;
  createdAt: string;
}

export interface ShipperLocation {
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export interface OrderTrackingResponse {
  timeline: StatusHistoryEntry[];
  shipperLocation: ShipperLocation | null;
  deliveryLocation: DeliveryLocation | null;
}

export interface UpdateShipperLocationRequest {
  latitude: number;
  longitude: number;
}
