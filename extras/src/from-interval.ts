import {IEmitOptions, SubEventCount} from '../../src';

/**
 * Example of sharing a time interval, based on the subscription count:
 * - we call `setInterval` whenever the first subscriber has been registered;
 * - we call `clearInterval` after the last subscription has been cancelled.
 *
 * The event is parameterized with its shared counter.
 */
export function fromInterval(timeout: number, options?: IEmitOptions): SubEventCount<number> {
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
