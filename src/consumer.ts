import {ISubOptions, ISubStat, SubEvent, SubFunction} from './event';
import {Subscription} from './sub';

// istanbul ignore next

/**
 * Encapsulates an event, in order to hide its methods [[emit]] and [[cancelAll]],
 * so the event consumer can only read/receive data, but cannot emit it, or cancel
 * other subscriptions.
 */
export class EventConsumer<T = unknown, E extends SubEvent<T> = SubEvent<T>> {

    /**
     * Encapsulated event object.
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

    get count(): number {
        return this.event.count;
    }

    get maxSubs(): number {
        return this.event.maxSubs;
    }

    subscribe(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return this.event.subscribe(cb, options);
    }

    once(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return this.event.once(cb, options);
    }

    toPromise(options?: { name?: string, timeout?: number }): Promise<T> {
        return this.event.toPromise(options);
    }

    getStat(options?: { minUse?: number }): ISubStat {
        return this.event.getStat(options);
    }

}
