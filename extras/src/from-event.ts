import {SubEvent, ISubContext, SubEventCount, IEmitOptions} from '../../src';

/**
 * Example of 1-to-1 hot observable DOM `Event` wrapping:
 * - every `subscribe` results in immediate `addEventListener` call;
 * - every `cancel` results in immediate `removeEventListener` call.
 */
export function fromEvent(source: Node, event: string, options?: IEmitOptions): SubEvent<Event> {
    const onSubscribe = (ctx: ISubContext<Event>) => {
        const handler: EventListener = e => ctx.event.emit(e, options);
        source.addEventListener(event, handler, false);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<Event>) => {
        source.removeEventListener(event, <EventListener>ctx.data, false);
    };
    return new SubEvent<Event>({onSubscribe, onCancel});
}

/**
 * Example of sharing hot-observable Event-s, based on their subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 */
export function fromSharedEvent(source: Node, event: string, options?: IEmitOptions): SubEventCount<Event> {
    const sec: SubEventCount<Event> = new SubEventCount();
    const handler: EventListener = e => sec.emit(e, options);
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