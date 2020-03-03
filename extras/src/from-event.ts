import {SubEventCount, IEmitOptions} from '../../src';

/**
 * Example of sharing a generic Event, based on the subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 */
export function fromEvent<T extends Event>(target: EventTarget, event: string, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler: EventListener = e => sec.emit(<T>e, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            target.addEventListener(event, handler, false);
        } else {
            if (stop) {
                target.removeEventListener(event, handler, false);
            }
        }
    });
    return sec;
}
