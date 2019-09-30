import {SubEvent, ISubContext, SubEventCount, IEmitOptions} from '../../src';

/**
 * Example of 1-to-1 DOM `Event` wrapping:
 * - every `subscribe` results in immediate `addEventListener` call;
 * - every `cancel` results in immediate `removeEventListener` call.
 */
export function fromEvent<T extends Event>(source: Node, event: string, options?: IEmitOptions): SubEvent<T> {
    const onSubscribe = (ctx: ISubContext<T>) => {
        const handler: EventListener = e => ctx.event.emit(<T>e, options);
        source.addEventListener(event, handler, false);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<T>) => {
        source.removeEventListener(event, <EventListener>ctx.data, false);
    };
    return new SubEvent<T>({onSubscribe, onCancel});
}

/**
 * Example of sharing an Event, based on the subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 */
export function shareEvent<T extends Event>(source: Node, event: string, options?: IEmitOptions): SubEventCount<T> {
    const sec: SubEventCount<T> = new SubEventCount();
    const handler: EventListener = e => sec.emit(<T>e, options);
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            source.addEventListener(event, handler, false);
        } else {
            if (stop) {
                source.removeEventListener(event, handler, false);
            }
        }
    });
    return sec;
}
