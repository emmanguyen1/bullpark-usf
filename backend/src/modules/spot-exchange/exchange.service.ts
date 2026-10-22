import { BullTradeSpot, BluetoothSignalEvent } from './exchange.types';
import { occupancyService } from '../occupancy/occupancy.service';
import { campusService } from '../campus/campus.service';

export class ExchangeService {
  private activeTrades: BullTradeSpot[] = [
    {
      id: 'trade-101',
      facilityId: 'lot-crescent-garage',
      facilityName: 'Crescent Hill Garage (Garage 4)',
      levelOrSection: 'Level 2, North Ramp',
      spotDescription: 'Right near stairs, Silver Honda Civic',
      departureInMinutes: 3,
      reportedBy: 'Jordan (Finance, BSN)',
      bullPointsReward: 50,
      status: 'available',
      createdAt: new Date().toLocaleTimeString()
    },
    {
      id: 'trade-102',
      facilityId: 'lot-beard-garage',
      facilityName: 'Richard A. Beard Garage (Garage 1)',
      levelOrSection: 'Level 1 (Shaded)',
      spotDescription: 'Spot 114 next to EV charger, Blue Camry',
      departureInMinutes: 5,
      reportedBy: 'Elena (Engineering, ENB)',
      bullPointsReward: 50,
      status: 'available',
      createdAt: new Date().toLocaleTimeString()
    }
  ];

  private recentTelemetryEvents: BluetoothSignalEvent[] = [];

  getActiveTrades(): BullTradeSpot[] {
    return this.activeTrades;
  }

  broadcastDeparture(
    trade: Omit<BullTradeSpot, 'id' | 'status' | 'bullPointsReward' | 'createdAt'>
  ): BullTradeSpot {
    const newTrade: BullTradeSpot = {
      ...trade,
      id: `trade-${Date.now()}`,
      status: 'available',
      bullPointsReward: 50,
      createdAt: new Date().toLocaleTimeString()
    };
    this.activeTrades.unshift(newTrade);
    return newTrade;
  }

  claimSpot(tradeId: string, studentName: string): BullTradeSpot | null {
    const trade = this.activeTrades.find((t) => t.id === tradeId);
    if (!trade || trade.status !== 'available') return null;

    trade.status = 'claimed';
    trade.claimedBy = studentName;
    return trade;
  }

  /**
   * Simulates passive Bluetooth / CarPlay telemetry signals.
   */
  simulateBluetoothSignal(
    eventType: 'DISCONNECTED' | 'CONNECTED',
    facilityId: string
  ): BluetoothSignalEvent {
    const facility = campusService.getFacilityById(facilityId);
    const facilityName = facility ? facility.name : 'USF Parking';

    let inferredAction: BluetoothSignalEvent['inferredAction'];
    let impactDescription: string;

    if (eventType === 'DISCONNECTED') {
      inferredAction = 'PARKED_AND_WALKING';
      impactDescription = `Bluetooth disconnected in ${facilityName}. Pinned car GPS location. Marked spot occupied.`;
    } else {
      inferredAction = 'STARTED_CAR_LEAVING';
      impactDescription = `Bluetooth reconnected and vehicle in motion. Spot marked opening up in ${facilityName}. +10 Bull Points awarded.`;
    }

    const event: BluetoothSignalEvent = {
      eventType,
      facilityId,
      facilityName,
      timestamp: new Date().toLocaleTimeString(),
      latitude: facility?.coordinates.latitude || 28.061,
      longitude: facility?.coordinates.longitude || -82.41,
      inferredAction,
      impactDescription
    };

    this.recentTelemetryEvents.unshift(event);
    if (this.recentTelemetryEvents.length > 10) {
      this.recentTelemetryEvents.pop();
    }

    return event;
  }

  getRecentTelemetry(): BluetoothSignalEvent[] {
    return this.recentTelemetryEvents;
  }
}

export const exchangeService = new ExchangeService();
