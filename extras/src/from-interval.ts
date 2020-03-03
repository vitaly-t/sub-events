import {IEmitOptions, SubEventCount} from '../../src';

/**
 * Creates a time-interval event:
 *
 * - The interval re-starts when the first subscriber registers;
 * - The interval stops when the last subscription is cancelled.
 */
export function fromInterval(timeout: number, options?: IEmitOptions): SubEventCount<void> {
    const sec: SubEventCount<void> = new SubEventCount();
    let timer: any;
    sec.onCount.subscribe(info => {
        const start = info.prevCount === 0; // fresh start
        const stop = info.newCount === 0; // no subscriptions left
        if (start) {
            timer = setInterval(() => {
                sec.emit(undefined, options);
            }, timeout);
        } else {
            if (stop) {
                clearInterval(timer);
            }
        }
    });
    return sec;
}
