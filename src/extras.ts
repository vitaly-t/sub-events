/**
 * This module is primarily for demo purposes, with simplified examples
 * of one-to-one versus shared resource wrapping, for comparison.
 */

import {SubEvent, ISubContext, SubEventCount} from './';

/**
 * Example of one-to-one event wrapping, which in this context means:
 * - every `subscribe` results in immediate `addEventListener` call;
 * - every `cancel` results in immediate `removeEventListener` call.
 */
export function fromEvent(source: Node, event: string): SubEvent<Event> {
    const onSubscribe = (ctx: ISubContext<Event, EventListener>) => {
        ctx.data = e => ctx.event.emitSync(e); // our event handler
        source.addEventListener(event, ctx.data, false);
    };
    const onCancel = (ctx: ISubContext<Event, EventListener>) => {
        source.removeEventListener(event, ctx.data || null, false);
    };
    return new SubEvent<Event>({onSubscribe, onCancel});
}

/**
 * Example of sharing Event-s, based on their subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 *
 * Such approach is suitable primarily for global resources, because we need to
 * permanently maintain our `onCount` subscription, which we never cancel.
 */
export function fromSharedEvent(source: Node, event: string): SubEventCount<Event> {
    const sec: SubEventCount<Event> = new SubEventCount();
    const handler = (e: Event) => sec.emitSync(e);
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
