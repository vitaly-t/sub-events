import {SubEvent} from './event';
import {SubEventCount} from './count';

/**
 * One-to-one event subscription mapping.
 */
export function fromEvent(source: Node, event: string): SubEvent<Event> {
    let handler: (e: Event) => void;
    const onSubscribe = (s: SubEvent) => {
        handler = e => s.emitSync(e);
        source.addEventListener(event, handler, false);
    };
    const onCancel = (s: SubEvent) => {
        source.removeEventListener(event, handler, false);
    };
    return new SubEvent<Event>({onSubscribe, onCancel});
}

/**
 * Suitable mostly for global event handlers, because we never cancel
 * the onCount subscription that we create.
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
