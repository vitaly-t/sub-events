import {IEmitOptions, ISubContext, ISubOptions, SubEvent, SubFunction, Subscription} from '../../src';

/**
 * Returns a new TimeoutEvent that triggers a fresh setTimeout on each subscribe,
 * and cancels the subscription after the timer event.
 *
 * And if the client cancels the subscription first, the event won't happen.
 */
export function fromTimeout(timeout: number = 0, options?: IEmitOptions): TimeoutEvent {
    return new TimeoutEvent(timeout, options);
}

/**
 * Implements a timeout event, with automatically cancelled subscriptions.
 *
 * A new timeout is started for every subscriber.
 */
export class TimeoutEvent extends SubEvent<void> {
    constructor(timeout: number = 0, options?: IEmitOptions) {
        const onSubscribe = (ctx: ISubContext<void>) => {
            ctx.data = setTimeout(() => {
                ctx.event.emit(undefined, options);
            }, timeout);
        };
        const onCancel = (ctx: ISubContext<void>) => {
            clearTimeout(ctx.data);
        };
        super({onSubscribe, onCancel});
    }

    subscribe(cb: SubFunction<void>, options?: ISubOptions): Subscription {
        const sub = super.subscribe(() => {
            sub.cancel();
            return cb.call(options?.thisArg);
        }, options);
        return sub;
    }
}
