export interface BullTradeSpot {
  id: string;
  facilityId: string;
  facilityName: string;
  levelOrSection: string;
  spotDescription: string;
  departureInMinutes: number;
  reportedBy: string; // e.g. "Alex (Junior, CS)"
  bullPointsReward: number;
  status: 'available' | 'claimed' | 'completed';
  claimedBy?: string;
  createdAt: string;
}

export interface BluetoothSignalEvent {
  eventType: 'DISCONNECTED' | 'CONNECTED';
  facilityId: string;
  facilityName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  inferredAction: 'PARKED_AND_WALKING' | 'STARTED_CAR_LEAVING';
  impactDescription: string;
}
