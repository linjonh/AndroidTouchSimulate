export interface HistoricalEvent {
  x: number;
  y: number;
  pressure: number;
  size: number;
  eventTime: number;
}

export interface PointerInfo {
  pointerId: number;
  x: number;
  y: number;
  pressure: number;
  size: number;
  toolType: number;
  toolTypeName: string;
  orientation: number;
  tiltX: number;
  tiltY: number;
}

export interface TouchEventRecord {
  id: number;
  gestureType: string;
  action: number;
  actionMasked: number;
  actionName: string;
  actionIndex: number;
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  pressure: number;
  size: number;
  eventTime: number;
  downTime: number;
  pointerCount: number;
  pointers: PointerInfo[];
  deviceId: number;
  source: number;
  sourceName: string;
  buttonState: number;
  metaState: number;
  state: number;
  flags: number;
  edgeFlags: number;
  xPrecision: number;
  yPrecision: number;
  historySize: number;
  historicalEvents: HistoricalEvent[];
  timestamp: number;
}

export interface TouchDataExport {
  exportTime: number;
  totalEvents: number;
  events: TouchEventRecord[];
}

export interface GestureSequence {
  id: string;
  type: string;
  startTime: number;
  endTime: number;
  points: {
    x: number;
    y: number;
    pressure: number;
    size: number;
    time: number;
    rawEvent?: any;
  }[];
}

export function processTouchEvents(data: TouchDataExport): GestureSequence[] {
  const sequences: GestureSequence[] = [];
  let currentSequence: GestureSequence | null = null;

  // Sort events by timestamp just in case
  const sortedEvents = [...data.events].sort((a, b) => a.timestamp - b.timestamp);

  sortedEvents.forEach((event) => {
    if (event.actionName === 'ACTION_DOWN') {
      currentSequence = {
        id: `gesture-${event.downTime}-${event.id}`,
        type: event.gestureType,
        startTime: event.eventTime,
        endTime: event.eventTime,
        points: []
      };
      sequences.push(currentSequence);
    }

    if (currentSequence) {
      // Add historical points first
      if (event.historicalEvents && event.historicalEvents.length > 0) {
        event.historicalEvents.forEach(h => {
          currentSequence?.points.push({
            x: h.x,
            y: h.y,
            pressure: h.pressure,
            size: h.size,
            time: h.eventTime,
            rawEvent: h
          });
        });
      }

      // Add current point
      currentSequence.points.push({
        x: event.x,
        y: event.y,
        pressure: event.pressure,
        size: event.size,
        time: event.eventTime,
        rawEvent: event
      });

      currentSequence.endTime = event.eventTime;

      if (event.actionName === 'ACTION_UP' || event.actionName === 'ACTION_CANCEL') {
        currentSequence = null;
      }
    }
  });

  return sequences;
}
