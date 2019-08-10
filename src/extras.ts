/**
 * This module is primarily for demo purposes, with simplified examples
 * of one-to-one versus shared resource wrapping, for comparison.
 */

import {SubEvent, ISubContext, SubEventCount} from './';
import EventEmitter = NodeJS.EventEmitter;

/**
 * Example of one-to-one event wrapping, which in this context means:
 * - every `subscribe` results in immediate `addEventListener` call;
 * - every `cancel` results in immediate `removeEventListener` call.
 */
export function fromEvent(source: Node, event: string): SubEvent<Event> {
    const onSubscribe = (ctx: ISubContext<Event>) => {
        const handler: EventListener = e => ctx.event.emitSync(e);
        source.addEventListener(event, handler, false);
        ctx.data = handler; // context for the event's lifecycle
    };
    const onCancel = (ctx: ISubContext<Event>) => {
        source.removeEventListener(event, <EventListener>ctx.data, false);
    };
    return new SubEvent<Event>({onSubscribe, onCancel});
}

/**
 * Example of sharing Event-s, based on their subscription count:
 * - we call `addEventListener` whenever the first subscriber has been registered;
 * - we call `removeEventListener` after the last subscription has been cancelled.
 *
 * Such approach is suitable primarily for global resources, because we need to
 * permanently maintain our `onCount` subscription, so we never cancel it.
 */
export function fromSharedEvent(source: Node, event: string): SubEventCount<Event> {
    const sec: SubEventCount<Event> = new SubEventCount();
    const handler: EventListener = e => sec.emitSync(e);
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

/**
 * Example of wrapping a named event from `EventEmitter`, and sending variable number
 * of event arguments into `subscribe` callback as an array of values.
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
 * Variable number of arguments emitted with the event become an array of values
 * when they arrive into `subscribe` callback function.
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
