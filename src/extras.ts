import {SubEvent} from './event';
import {SubEventCount} from './count';

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
export function shareFromEvent(source: Node, event: string): SubEvent<Event> {
    const sub: SubEventCount<Event> = new SubEventCount();
    let handler = (e: Event) => sub.emitSync(e);
    sub.onCount.subscribe(info => {
        const ended = info.newCount === 0; // all subscriptions cancelled
        const started = info.prevCount === 0; // freshly started
        if (started) {
            source.addEventListener(event, handler, false);
        } else {
            if (ended) {
                source.removeEventListener(event, handler, false);
            }
        }
    });
    return sub;
}
