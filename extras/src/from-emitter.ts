import {IEmitOptions, SubEventCount} from '../../src';
import {EventEmitter} from 'events';

/**
 * Creates a named event from emitter, for one-argument, strongly-typed events.
 *
 * If your event takes multiple arguments, see fromEmitterArgs below.
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
 * Creates a named event from emitter, for multi-argument, tuple-type events.
 *
 * The emitted arguments are passed into the handler as an array or as a tuple.
 */
export function fromEmitterArgs<T extends unknown[]>(target: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler = (...args: any[]) => sec.emit(args as T, options);
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
