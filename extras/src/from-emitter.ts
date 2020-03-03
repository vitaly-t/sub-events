import {IEmitOptions, SubEventCount} from '../../src';
import {EventEmitter} from 'events';

/**
 * Example of sharing a generic EventEmitter, based on the subscription count:
 * - we call `addListener` whenever the first subscriber has been registered;
 * - we call `removeListener` after the last subscription has been cancelled.
 *
 * This wrapper is simplified to support only the first emitted argument,
 * type for which therefore can be specified, for strongly-typed events.
 */
export function fromEmitter<T = unknown>(target: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler = (a: T) => sec.emit(a, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            target.addListener(event, handler);
        } else {
            if (stop) {
                target.removeListener(event, handler);
            }
        }
    });
    return sec;
}

/**
 * Example of sharing a generic EventEmitter, based on the subscription count:
 * - we call `addListener` whenever the first subscriber has been registered;
 * - we call `removeListener` after the last subscription has been cancelled.
 *
 * It supports full array of arguments emitted with the event,
 * which are then passed into the handler as an array of values.
 */
export function fromEmitterArgs(target: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEventCount<any[]> {
    const sec: SubEventCount<any[]> = new SubEventCount();
    const handler = (...args: any[]) => sec.emit(args, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            target.addListener(event, handler);
        } else {
            if (stop) {
                target.removeListener(event, handler);
            }
        }
    });
    return sec;
}
