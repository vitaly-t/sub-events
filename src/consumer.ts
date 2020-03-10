import {ISubOptions, ISubStat, SubEvent, SubFunction} from './event';
import {Subscription} from './sub';

/**
 * #### class EventConsumer\<T = unknown, E extends SubEvent\<T\> = SubEvent\<T\>>
 *
 * Encapsulates an event object, in order to hide its methods [[emit]] and [[cancelAll]], so the event
 * consumer can only receive the event, but cannot emit it, or cancel other subscriptions.
 *
 * The class has the same signature as [[SubEvent]], minus methods [[emit]] and [[cancelAll]].
 *
 * ```ts
 * // Example of using EventConsumer inside a component.
 *
 * import {SubEvent, EventConsumer} from 'sub-events';
 *
 * class MyComponent {
 *
 *     private event: SubEvent<string> = new SubEvent(); // internal, send-receive event
 *
 *     readonly safeEvent: EventConsumer<string>; // public, receive-only event container
 *
 *     constructor() {
 *        this.safeEvent = new EventConsumer(this.event);
 *
 *        // clients can only receive data from such "safeEvent",
 *        // they cannot emit data or cancel other subscriptions.
 *     }
 * }
 * ```
 *
 */
export class EventConsumer<T = unknown, E extends SubEvent<T> = SubEvent<T>> {

    /**
     * Encapsulated event object.
     *
     * It has protected access, to be accessible from a derived class,
     * in case you want to contain a custom event that offers properties and methods
     * to be exposed to event listeners. You would just have your derived consumer
     * class re-declare those and forward into the contained event.
     */
    protected event: E;

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
