import {SubEvent, ISubContext, SubEventCount} from './';

/**
 * This module here serves two purposes:
 *
 * 1. It shows how to wrap events as one-to-one for the original ones,
 *    versus sharing original events based on their subscription count.
 *
 * 2. The implementation here is hands-on practical, though not so flexible,
 *    but it can be used right away as it is. See the notes about it below.
 *
 * But in all, it is just a demo that validates the general approach to
 * wrapping existing events into the simpler subscribe-cancel approach.
 */


/**
 * Example of one-to-one event wrapping for global type Event.
 *
 * In this context, one-to-one means that every `subscribe` call results
 * in the immediate `addEventListener` call, and every `cancel` call on
 * the returned `Subscription` object results in the immediate call of
 * `removeEventListener`.
 *
 * This implementation is simplistic, just to show the general approach:
 *  - it assumes that in a browser, you would want to forward events
 *    synchronously, so it uses `emitSync`;
 *  - it does not use `emitSyncSafe` to let you accumulate errors;
 *
 *  But you can easily extend it to allow for much more flexibility.
 */
export function fromEvent(source: Node, event: string): SubEvent<Event> {
    const onSubscribe = (ctx: ISubContext<Event, EventListener>) => {
        ctx.data = e => ctx.event.emitSync(e);
        source.addEventListener(event, ctx.data, false);
    };
    const onCancel = (ctx: ISubContext<Event, EventListener>) => {
        source.removeEventListener(event, ctx.data, false);
    };
    return new SubEvent<Event>({onSubscribe, onCancel});
}

/**
 * Example of wrapping global Event-s in a shared manner, based on their subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 *
 * Such approach is suitable primarily for globally used events, because we need to permanently
 * maintain our subscription for the `onCount` event, and so we can never cancel it.
 *
 * As above, it is a simplified implementation, but you can improve it easily, if needed:
 *  - it assumes that in a browser, you would want to forward events synchronously,
 *    so it uses `emitSync`;
 *  - it does not use `emitSyncSafe` to let you accumulate errors;
 *
 */
export function fromSharedEvent(source: Node, event: string): SubEvent<Event> {
    const sub: SubEventCount<Event> = new SubEventCount();
    let handler = (e: Event) => sub.emitSync(e);
    sub.onCount.subscribe(info => {
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
    return sub;
}
