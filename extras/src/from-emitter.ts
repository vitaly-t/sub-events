import {IEmitOptions, ISubContext, SubEvent, SubEventCount} from '../../src';
import {EventEmitter} from 'events';

/**
 * Example of 1-to-1 generic `EventEmitter` wrapping:
 * - every `subscribe` results in immediate `addListener` call;
 * - every `cancel` results in immediate `removeListener` call.
 *
 * This wrapper is simplified to support only the first emitted argument,
 * type for which therefore can be specified, for strongly-typed events.
 */
export function fromEmitter<T = unknown>(source: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEvent<T> {
    const onSubscribe = (ctx: ISubContext<T>) => {
        const handler = (a: T) => ctx.event.emit(a, options);
        source.addListener(event, handler);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<T>) => {
        source.removeListener(event, <() => void>ctx.data);
    };
    return new SubEvent<T>({onSubscribe, onCancel});
}

/**
 * Example of 1-to-1 generic `EventEmitter` wrapping:
 * - every `subscribe` results in immediate `addListener` call;
 * - every `cancel` results in immediate `removeListener` call.
 *
 * It supports full array of arguments emitted with the event,
 * which are then passed into the handler as an array of values.
 */
export function fromEmitterArgs(source: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEvent<any[]> {
    const onSubscribe = (ctx: ISubContext<any[]>) => {
        const handler = (...args: any[]) => ctx.event.emit(args, options);
        source.addListener(event, handler);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<any[]>) => {
        source.removeListener(event, <() => void>ctx.data);
    };
    return new SubEvent<any[]>({onSubscribe, onCancel});
}

/**
 * Example of sharing a generic EventEmitter, based on the subscription count:
 * - we call `addListener` whenever the first subscriber has been registered;
 * - we call `removeListener` after the last subscription has been cancelled.
 *
 * This wrapper is simplified to support only the first emitted argument,
 * type for which therefore can be specified, for strongly-typed events.
 */
export function shareEmitter<T = unknown>(source: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler = (a: T) => sec.emit(a, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            source.addListener(event, handler);
        } else {
            if (stop) {
                source.removeListener(event, handler);
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
export function shareEmitterArgs(source: EventEmitter, event: string | symbol, options?: IEmitOptions): SubEventCount<any[]> {
    const sec: SubEventCount<any[]> = new SubEventCount();
    const handler = (...args: any[]) => sec.emit(args, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            source.addListener(event, handler);
        } else {
            if (stop) {
                source.removeListener(event, handler);
            }
        }
    });
    return sec;
}
