import {SubEventCount, IEmitOptions} from '../../src';

/**
 * Helps supporting any custom Event-like type.
 */
interface IEventLike {
    addEventListener: (type: string, callback: (e: Event) => void) => this;
    removeEventListener: (type: string, callback: (e: Event) => void) => this;
}

/**
 * Creates a strongly-typed, named DOM Event wrapper.
 */
export function fromEvent<T extends Event>(target: IEventLike, event: string, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler: EventListener = e => sec.emit(<T>e, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            target.addEventListener(event, handler);
        } else {
            if (stop) {
                target.removeEventListener(event, handler);
            }
        }
    });
    return sec;
}
