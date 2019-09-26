import {IEmitOptions, ISubContext, SubEvent, SubEventCount} from '../../src';

/**
 * Example of 1-to-1 hot-observable time interval wrapping:
 * - every `subscribe` results in `setInterval` call;
 * - every `cancel` results in `clearInterval` call.
 *
 * The event is parameterized with its counter.
 */
export function fromInterval(timeout: number, options?: IEmitOptions): SubEvent<number> {
    let count = 0; // event counter
    const onSubscribe = (ctx: ISubContext<number>) => {
        ctx.data = setInterval(() => {
            ctx.event.emit(++count, options);
        }, timeout);
    };
    const onCancel = (ctx: ISubContext<number>) => {
        clearInterval(<any>ctx.data);
    };
    return new SubEvent<number>({onSubscribe, onCancel});
}

/**
 * Example of sharing hot-observable time interval, based on the subscription count:
 * - we call `setInterval` whenever the first subscriber has been registered;
 * - we call `clearInterval` after the last subscription has been cancelled.
 *
 * The event is parameterized with its shared counter.
 */
export function fromSharedInterval(timeout: number, options?: IEmitOptions): SubEventCount<number> {
    const sec: SubEventCount<number> = new SubEventCount();
    let timer: any, count = 0; // shared event counter
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            timer = setInterval(() => {
                sec.emit(++count, options);
            }, timeout);
        } else {
            if (stop) {
                clearInterval(timer);
                count = 0; // resetting shared counter
            }
        }
    });
    return sec;
}
