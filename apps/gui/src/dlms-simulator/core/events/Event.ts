import { EventType } from './EventType';

export class Event {
    constructor(
        public readonly type: EventType,
        public readonly timestamp: number,
        public readonly duration: number,
        public readonly details: any
    ) {}

    public toJSON(): any {
        return {
            type: this.type,
            timestamp: this.timestamp,
            duration: this.duration,
            details: this.details
        };
    }

    public static fromJSON(json: any): Event {
        return new Event(
            json.type,
            json.timestamp,
            json.duration,
            json.details
        );
    }
} 