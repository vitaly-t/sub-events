import {ISubContext, ISubOptions, SubEvent, SubFunction, Subscription} from '../src';

/**
 * Implements timeout event, with automatically cancelled subscriptions.
 *
 * It also illustrates the general approach to implementing events with
 * self-cancel subscription logic.
 */
export class TimeoutEvent extends SubEvent<void> {
    constructor(timeout: number = 0) {
        const onSubscribe = (ctx: ISubContext<void>) => {
            ctx.data = setTimeout(() => {
                ctx.event.emit();
            }, timeout);
        };
        const onCancel = (ctx: ISubContext<void>) => {
            clearInterval(<number>ctx.data);
        };
        super({onSubscribe, onCancel});
    }

    subscribe(cb: SubFunction<void>, options?: ISubOptions): Subscription {
        const sub = super.subscribe(() => {
            sub.cancel(); // cancel subscription
            cb();
        }, options);
        return sub;
    }
}

/**
 * Returns a new TimeoutEvent that triggers a fresh setTimeout on each subscribe,
 * and cancels the subscription on the timer event.
 *
 * And if the client cancels the subscription first, the event won't happen.
 */
export function fromTimeout(timeout: number = 0): TimeoutEvent {
    return new TimeoutEvent(timeout);
}
