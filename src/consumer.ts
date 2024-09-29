import {ISubOptions, ISubStat, SubEvent, SubFunction} from './event';
import {Subscription} from './sub';
import {Private} from './utils';

/**
 * Private-property implementation.
 *
 * @hidden
 */
const pp = new Private<EventConsumer, SubEvent<any>>();

/**
 * Encapsulates an event object, in order to hide its methods {@link SubEvent.emit} and {@link SubEvent.cancelAll},
 * so the event consumer can only receive the event, but cannot emit it, or cancel other subscriptions.
 *
 * It is a non-extendable class, with the same signature as {@link SubEvent}, minus {@link SubEvent.emit emit} and {@link SubEvent.cancelAll cancelAll}.
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
 *        // or even simpler:
 *        // this.safeEvent = this.event.toConsumer();
 *
 *        // clients can only receive data from such "safeEvent",
 *        // they cannot emit data or cancel other subscriptions.
 *     }
 * }
 * ```
 */
export class EventConsumer<T = unknown, E extends SubEvent<T> = SubEvent<T>> {

    /**
     * Class Constructor.
     *
     * @param event
     * Event object to be encapsulated.
     */
    constructor(event: E) {
        pp.set(this, event);
    }

    /**
     * Forwards into {@link SubEvent.count} of the contained event.
     */
    get count(): number {
        return pp.get(this).count;
    }

    /**
     * Forwards into {@link SubEvent.maxSubs} of the contained event.
     */
    get maxSubs(): number {
        return pp.get(this).maxSubs;
    }

    /**
     * Forwards into {@link SubEvent.subscribe} of the contained event.
     */
    subscribe(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return pp.get(this).subscribe(cb, options);
    }

    /**
     * Forwards into {@link SubEvent.once} of the contained event.
     */
    once(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        return pp.get(this).once(cb, options);
    }

    /**
     * Forwards into {@link SubEvent.toPromise} of the contained event.
     */
    toPromise(options?: { name?: string, timeout?: number }): Promise<T> {
        return pp.get(this).toPromise(options);
    }

    /**
     * Forwards into {@link SubEvent.getStat} of the contained event.
     */
    getStat(options?: { minUse?: number }): ISubStat {
        return pp.get(this).getStat(options);
    }

}
