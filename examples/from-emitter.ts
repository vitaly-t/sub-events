import {ISubContext, SubEvent, SubEventCount} from '../src';
import EventEmitter = NodeJS.EventEmitter;

/**
 * Example of one-to-one `EventEmitter` wrapping:
 * - every `subscribe` results in immediate `addListener` call;
 * - every `cancel` results in immediate `removeListener` call.
 *
 * Variable number of arguments emitted with the event become an array
 * of values when they arrive into `subscribe` callback function.
 */
export function fromEmitter(source: EventEmitter, event: string | symbol): SubEvent<any[]> {
    const onSubscribe = (ctx: ISubContext<any[]>) => {
        const handler = (...args: any[]) => ctx.event.emit(args);
        source.addListener(event, handler);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<any[]>) => {
        source.removeListener(event, <() => void>ctx.data);
    };
    return new SubEvent<any[]>({onSubscribe, onCancel});
}

/**
 * Example of sharing a named event from `EventEmitter`:
 * - we call `addListener` whenever the first subscriber has been registered;
 * - we call `removeListener` after the last subscription has been cancelled.
 *
 * Variable number of arguments emitted with the event become an array
 * of values when they arrive into `subscribe` callback function.
 */
export function fromSharedEmitter(source: EventEmitter, event: string | symbol): SubEventCount<any[]> {
    const sec: SubEventCount<any[]> = new SubEventCount();
    const handler = (...args: any[]) => sec.emit(args);
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
