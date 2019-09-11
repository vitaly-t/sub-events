import {Subscription} from './sub';

/**
 * Schedule for emitting / broadcasting data to subscribers, to be used by method [[emit]].
 * It represents a concurrency strategy for delivering event data to subscribers.
 */
export enum EmitSchedule {

    /**
     * Data is sent to all subscribers synchronously / immediately.
     *
     * This is the default schedule.
     */
    sync = 'sync',

    /**
     * Data is sent asynchronously. Each subscriber will be receiving the event
     * within its own processor tick (under Node.js), or timer tick (in browsers).
     */
    async = 'async',

    /**
     * Wait for the next processor tick (under Node.js), or timer tick (in browsers),
     * and then broadcast data to all subscribers synchronously.
     */
    next = 'next'
}

/**
 * @interface IEmitOptions
 * @description
 * Options to be used with method [[emit]].
 */
export interface IEmitOptions {
    /**
     * Event emitting schedule. Default is `sync`.
     */
    schedule?: EmitSchedule;

    /**
     * Callback for catching all unhandled errors from subscribers,
     * from both synchronous and asynchronous subscription functions.
     *
     * ```js
     * (err: any, name?: string) => void;
     * ```
     *
     * @param err
     * `err`: The error that was thrown or rejected.
     *
     * @param name
     * `name`: The subscription `name`, if set during [[subscribe]] call.
     */
    onError?: (err: any, name?: string) => void;

    /**
     * Notification callback of when the last recipient has received the data.
     * Note that asynchronous subscribers may still be processing the data at this point.
     *
     * ```js
     * (count: number) => void;
     * ```
     *
     * @param count
     * `count`: Total number of subscribers that have received the data.
     */
    onFinished?: (count: number) => void;
}

/**
 * @interface ISubContext
 * @description
 * Subscription Context Interface, as used with [[onSubscribe]] and [[onCancel]]
 * notification options that can be set during [[SubEvent]] construction.
 */
export interface ISubContext<T = unknown> {
    /**
     * Event object that provides the context.
     */
    readonly event: SubEvent<T>;

    /**
     * Subscription name, if one was specified with method [[subscribe]].
     */
    readonly name?: string;

    /**
     * Unknown-type data to let event wrappers persist any
     * context they need within the event's lifecycle.
     */
    data: unknown;
}

/**
 * @interface IEventOptions
 * @description
 * Constructor options for [[SubEvent]] class.
 */
export interface IEventOptions<T> {
    /**
     * Maximum number of subscribers that can receive events.
     * Default is 0, meaning `no limit applies`.
     *
     * Newer subscriptions outside of the maximum quota will start
     * receiving events when the older subscriptions get cancelled.
     */
    maxSubs?: number;

    /**
     * Notification of a new subscriber being registered.
     *
     * ```js
     * (ctx: ISubContext<T>) => void;
     * ```
     *
     * @param ctx
     * `ctx`: Subscription context.
     */
    onSubscribe?: (ctx: ISubContext<T>) => void;

    /**
     * Notification about a cancelled subscription.
     *
     * ```js
     * (ctx: ISubContext<T>) => void;
     * ```
     *
     * @param ctx
     * `ctx`: Subscription context.
     */
    onCancel?: (ctx: ISubContext<T>) => void;
}

/**
 * @interface ISubOptions
 * @description
 * Options that can be passed into method [[subscribe]].
 */
export interface ISubOptions {

    /**
     * Unique subscription name. It helps with diagnosing subscription leaks,
     * via method [[getStat]], and provides additional details during error handling.
     * The name should help identify place in the code where the subscription is created.
     *
     * @see [[getStat]]
     */
    name?: string;

    /**
     * Calling / `this` context for the subscription callback function.
     *
     * Standard way of passing in context is this way:
     * ```ts
     * event.subscribe(func.bind(this))
     * ```
     * With this option you can also do it this way:
     * ```ts
     * event.subscribe(func, {thisArg: this})
     * ```
     */
    thisArg?: any;
}

/**
 * Subscriptions statistics, as returned by method [[getStat]].
 */
export interface ISubStat {

    /**
     * Map of subscription names to their usage counters. It consists of only
     * subscriptions for which option `name` was set when calling [[subscribe]].
     */
    named: { [name: string]: number };

    /**
     * Total number of unnamed subscriptions.
     */
    unnamed: number;
}

/**
 * Subscription callback function type.
 */
export type SubFunction<T> = (data: T) => any;

/**
 * Internal structure for each subscriber.
 * @hidden
 */
export interface ISubscriber<T> extends ISubContext<T> {

    /**
     * Event notification callback function.
     */
    cb: SubFunction<T> | null;

    /**
     * Cancels the subscription.
     */
    cancel: (() => void);
}

/**
 * @class SubEvent
 * @description
 * Core class, implementing event subscription + emitting the event.
 *
 * @see [[subscribe]], [[emit]]
 */
export class SubEvent<T = unknown> {

    /**
     * @hidden
     */
    readonly options: IEventOptions<T>;

    /**
     * Internal list of subscribers.
     * @hidden
     */
    protected _subs: ISubscriber<T>[] = [];

    /**
     * @constructor
     * Event constructor.
     *
     * @param options
     * Configuration Options.
     */
    constructor(options?: IEventOptions<T>) {
        this.options = options || {};
    }

    /**
     * Subscribes to the event.
     *
     * When subscription is no longer needed, method [[cancel]] should be called
     * on the returned object, to avoid memory leaks and performance degradation.
     * Method [[getStat]] can help with diagnosing leaked subscriptions.
     *
     * @param cb
     * Event notification callback function.
     *
     * @param options
     * Subscription options.
     *
     * @returns
     * Object for cancelling the subscription safely.
     */
    public subscribe(cb: SubFunction<T>, options?: ISubOptions): Subscription {
        // istanbul ignore next
        const cancel = () => {
            // Subscription replaces it with actual cancellation
        };
        cb = options && 'thisArg' in options ? cb.bind(options.thisArg) : cb;
        const name = options && options.name;
        const sub: ISubscriber<T> = {event: this, data: undefined, cb, cancel, name};
        if (typeof this.options.onSubscribe === 'function') {
            const ctx: ISubContext<T> = {event: sub.event, name: sub.name, data: sub.data};
            this.options.onSubscribe(ctx);
            sub.data = ctx.data;
        }
        this._subs.push(sub);
        return new Subscription({cancel: this._createCancel(sub), sub});
    }

    /**
     * Broadcasts data to all subscribers, according to the emit schedule,
     * which is synchronous by default.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param options
     * Event emitting options.
     *
     * @returns
     * Number of subscribers to receive the data.
     */
    public emit(data: T, options?: IEmitOptions): number {
        const schedule: EmitSchedule = (options && options.schedule) || EmitSchedule.sync;
        const onFinished = options && typeof options.onFinished === 'function' && options.onFinished;
        const onError = options && typeof options.onError === 'function' && options.onError;
        const start = schedule === EmitSchedule.next ? SubEvent._callNext : SubEvent._callNow;
        const middle = schedule === EmitSchedule.async ? SubEvent._callNext : SubEvent._callNow;
        const r = this._getRecipients();
        start(() => {
            r.forEach((sub, index) => middle(() => {
                if (onError) {
                    try {
                        const res = sub.cb && sub.cb(data);
                        if (res && typeof res.catch === 'function') {
                            res.catch((err: any) => onError(err, sub.name));
                        }
                    } catch (e) {
                        onError(e, sub.name);
                    }
                } else {
                    if (sub.cb) {
                        sub.cb(data);
                    }
                }
                if (onFinished && index === r.length - 1) {
                    onFinished(r.length); // finished sending
                }
            }));
        });
        return r.length;
    }

    /**
     * Current number of subscriptions.
     */
    public get count(): number {
        return this._subs.length;
    }

    /**
     * Maximum number of subscribers that can receive events.
     * Default is 0, meaning `no limit applies`.
     *
     * Newer subscriptions outside of the maximum quota will start
     * receiving events when the older subscriptions get cancelled.
     *
     * It can only be set with the [[constructor]].
     */
    public get maxSubs(): number {
        return this.options.maxSubs || 0;
    }

    /**
     * Retrieves subscriptions statistics, to help with diagnosing subscription leaks.
     *
     * For this method to be useful, you need to set option `name` when calling [[subscribe]].
     *
     * See also: {@link https://github.com/vitaly-t/sub-events/wiki/Diagnostics Diagnostics}
     *
     * @param options
     * Statistics Options:
     *
     *  - `minUse: number` - Minimum subscription usage/count to be included into the list of named
     *     subscriptions. If subscription is used less times, it will be excluded from the `named` list.
     */
    public getStat(options?: { minUse?: number }): ISubStat {
        const stat: ISubStat = {named: {}, unnamed: 0};
        this._subs.forEach(s => {
            if (s.name) {
                if (s.name in stat.named) {
                    stat.named[s.name]++;
                } else {
                    stat.named[s.name] = 1;
                }
            } else {
                stat.unnamed++;
            }
        });
        const minUse = (options && options.minUse) || 0;
        if (minUse > 1) {
            for (const a in stat.named) {
                if (stat.named[a] < minUse) {
                    delete stat.named[a];
                }
            }
        }
        return stat;
    }

    /**
     * Cancels all subscriptions.
     *
     * @returns
     * Number of subscriptions cancelled.
     */
    public cancelAll(): number {
        const onCancel = typeof this.options.onCancel === 'function' && this.options.onCancel;
        const copy = onCancel ? [...this._subs] : [];
        const n = this._subs.length;
        this._subs.forEach(sub => {
            sub.cancel();
            sub.cb = null; // prevent further emits
        });
        this._subs.length = 0;
        if (onCancel) {
            copy.forEach(c => {
                const ctx: ISubContext<T> = {event: c.event, name: c.name, data: c.data};
                onCancel(ctx);
            });
        }
        return n;
    }

    /**
     * Gets all recipients that must receive data.
     *
     * It returns a copy of subscribers array for safe iteration, while applying the
     * maximum limit when it is set with the [[maxSubs]] option.
     *
     * @hidden
     */
    protected _getRecipients(): ISubscriber<T>[] {
        const end = this.maxSubs > 0 ? this.maxSubs : this._subs.length;
        return this._subs.slice(0, end);
    }

    /**
     * Creates unsubscribe callback function for the [[Subscription]] class.
     * @hidden
     *
     * @param sub
     * Subscriber details.
     *
     * @returns
     * Function that implements the [[unsubscribe]] request.
     */
    protected _createCancel(sub: ISubscriber<T>): () => void {
        return () => {
            this._cancelSub(sub);
        };
    }

    /**
     * Cancels an existing subscription.
     * @hidden
     *
     * @param sub
     * Subscriber to be removed, which must be on the list.
     */
    protected _cancelSub(sub: ISubscriber<T>) {
        this._subs.splice(this._subs.indexOf(sub), 1);
        sub.cancel();
        sub.cb = null; // prevent further emits
        if (typeof this.options.onCancel === 'function') {
            const ctx: ISubContext<T> = {event: sub.event, name: sub.name, data: sub.data};
            this.options.onCancel(ctx);
        }
    }

    // istanbul ignore next: we are not auto-testing in the browser
    /**
     * For compatibility with web browsers.
     *
     * @hidden
     */
    protected static _callNext = typeof process === 'undefined' ? setTimeout : process.nextTick;

    /**
     * @hidden
     */
    protected static _callNow = (callback: Function) => callback();
}
