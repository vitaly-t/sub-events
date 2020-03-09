import {ISubOptions, ISubStat, SubEvent, SubFunction} from './event';
import {Subscription} from './sub';

/**
 * Encapsulates an event, in order to hide its methods [[emit]] and [[cancelAll]],
 * so the event consumer can only read/receive data, but cannot emit it, or cancel
 * other subscriptions.
 */
export class EventConsumer<T = unknown, E extends SubEvent<T> = SubEvent<T>> {

    /**
     * Encapsulated an event object.
     */
    private event: E;

    /**
     * Class Constructor.
     *
     * @param event
     * Event object to be encapsulated.
     */
    constructor(event: E) {
        this.event = event;
    }

    /**
     * Forwards into [[SubEvent.count]] of the contained event.
     */
    get count(): number {
        return this.event.count;
    }

    /**
     * Forwards into [[SubEvent.maxSubs]] of the contained event.
     */
    get maxSubs(): number {
        return this.event.maxSubs;
    }

    /**
     * Forwards into [[SubEvent.subscribe]] of the contained event.
     */
    subscribe(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return this.event.subscribe(cb, options);
    }

    /**
     * Forwards into [[SubEvent.once]] of the contained event.
     */
    once(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return this.event.once(cb, options);
    }

    /**
     * Forwards into [[SubEvent.toPromise]] of the contained event.
     */
    toPromise(options?: { name?: string, timeout?: number }): Promise<T> {
        return this.event.toPromise(options);
    }

    /**
     * Forwards into [[SubEvent.getStat]] of the contained event.
     */
    getStat(options?: { minUse?: number }): ISubStat {
        return this.event.getStat(options);
    }

}
