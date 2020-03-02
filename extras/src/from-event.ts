import {SubEvent, ISubContext, SubEventCount, IEmitOptions} from '../../src';

/**
 * Example of 1-to-1 generic `Event` wrapping:
 * - every `subscribe` results in immediate `addEventListener` call;
 * - every `cancel` results in immediate `removeEventListener` call.
 */
export function fromEvent<T extends Event>(target: EventTarget, event: string, options?: IEmitOptions): SubEvent<T> {
    const onSubscribe = (ctx: ISubContext<T>) => {
        const handler: EventListener = e => ctx.event.emit(<T>e, options);
        target.addEventListener(event, handler, false);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<T>) => {
        target.removeEventListener(event, ctx.data, false);
    };
    return new SubEvent<T>({onSubscribe, onCancel});
}

/**
 * Example of sharing a generic Event, based on the subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 */
export function shareEvent<T extends Event>(target: EventTarget, event: string, options?: IEmitOptions): SubEventCount<T> {
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
