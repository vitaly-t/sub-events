import {SubEventCount, IEmitOptions} from '../../src';

/**
 * Creates a strongly-typed, named DOM Event wrapper.
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
