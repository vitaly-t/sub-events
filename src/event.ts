import {Subscription} from './sub';

/**
 * @interface ISubContext
 * @description
 * Subscription Context Interface.
 */
export interface ISubContext<T = unknown> {
    /**
     * Event class that provides the context.
     */
    readonly event: SubEvent<T>;

    /**
     * Unknown-type data to let the event wrapper persist any
     * context it needs within the event's lifecycle.
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
     * As the older subscriptions get cancelled, the newer ones
     * outside of the maximum quota will start receiving events.
     */
    maxSubs?: number;

    /**
     * Notification of a new subscriber being registered.
     *
     * The callback takes [[ISubContext]] as the only parameter.
     */
    onSubscribe?: (ctx: ISubContext<T>) => void;

    /**
     * Notification about a cancelled subscription.
     *
     * The callback takes [[ISubContext]] as the only parameter.
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
 * Implements event subscription + emitting the event.
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
     * Subscribes for the event.
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
        const sub: ISubscriber<T> = {event: this, data: undefined, cb, cancel};
        if (typeof this.options.onSubscribe === 'function') {
            this.options.onSubscribe(sub);
        }
        this._subs.push(sub);
        return new Subscription(this._createCancel(sub), sub);
    }

    /**
     * Asynchronous data broadcast to all subscribers. Each subscriber will be receiving
     * the event within its own processor tick (under Node.js), or timer tick (in browsers).
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param onFinished
     * Optional callback function to be notified when the last recipient has received the data.
     * The function takes one parameter - total number of clients that have received the data.
     * Note that asynchronous subscribers may still be processing the data at this point.
     *
     * @returns
     * Number of clients that will be receiving the data.
     */
    public emit(data: T, onFinished?: (count: number) => void): number {
        const r = this._getRecipients();
        r.forEach((sub, index) => SubEvent._nextCall(() => {
            if (sub.cb) {
                sub.cb(data);
            }
            if (index === r.length - 1 && typeof onFinished === 'function') {
                onFinished(r.length); // finished sending
            }
        }));
        return r.length;
    }

    /**
     * Safe asynchronous data broadcast to all subscribers. Each subscriber will be receiving
     * the event within its own processor tick (under Node.js), or timer tick (in browsers).
     *
     * Errors from subscription callbacks are passed into `onError` function, to handle both
     * synchronous and asynchronous subscription functions.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param onError
     * Callback for catching all unhandled errors from subscribers.
     *
     * @param onFinished
     * Optional callback function to be notified when the last recipient has received the data.
     * The function takes one parameter - total number of clients that have received the data.
     * Note that asynchronous subscribers may still be processing the data at this point.
     *
     * @returns
     * Number of clients that will be receiving the data.
     */
    public emitSafe(data: T, onError: (err: any) => void, onFinished?: (count: number) => void): number {
        const r = this._getRecipients();
        r.forEach((sub, index) => SubEvent._nextCall(() => {
            try {
                const res = sub.cb && sub.cb(data);
                if (res && typeof res.catch === 'function') {
                    res.catch(onError);
                }
            } catch (e) {
                onError(e);
            } finally {
                if (index === r.length - 1 && typeof onFinished === 'function') {
                    onFinished(r.length); // finished sending
                }
            }
        }));
        return r.length;
    }

    /**
     * Synchronous data broadcast to all subscribers. The event is delivered
     * to all subscribers immediately.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @returns
     * Number of clients that have received the data.
     *
     * Note that asynchronous subscribers may still be processing the data.
     */
    public emitSync(data: T): number {
        const r = this._getRecipients();
        r.forEach(sub => sub.cb && sub.cb(data));
        return r.length;
    }

    /**
     * Safe synchronous data broadcast to all subscribers. The event is delivered
     * to all subscribers immediately.
     *
     * Errors from subscription callbacks are passed into `onError` function,
     * to handle both synchronous and asynchronous subscription functions.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param onError
     * Callback for catching all unhandled errors from subscribers.
     *
     * @returns
     * Number of clients that have received the data.
     *
     * Note that asynchronous subscribers may still be processing the data.
     */
    public emitSyncSafe(data: T, onError: (err: any) => void): number {
        const r = this._getRecipients();
        r.forEach(sub => {
            try {
                const res = sub.cb && sub.cb(data);
                if (res && typeof res.catch === 'function') {
                    res.catch(onError);
                }
            } catch (e) {
                onError(e);
            }
        });
        return r.length;
    }

    /**
     * Current number of live subscriptions.
     */
    public get count(): number {
        return this._subs.length;
    }

    /**
     * Maximum number of subscribers that can receive events.
     * Default is 0, meaning `no limit applies`.
     *
     * As the older subscriptions get cancelled, the newer ones
     * outside of the maximum quota will start receiving events.
     */
    public get maxSubs(): number {
        return this.options.maxSubs || 0;
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
            sub.cb = null; // stops async emits
        });
        this._subs.length = 0;
        if (onCancel) {
            copy.forEach(c => onCancel(c));
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
        sub.cb = null; // stops async emits
        if (typeof this.options.onCancel === 'function') {
            this.options.onCancel(sub);
        }
    }

    // istanbul ignore next: we are not auto-testing in the browser
    /**
     * For compatibility with web browsers.
     *
     * @hidden
     */
    protected static _nextCall = typeof process === 'undefined' ? setTimeout : process.nextTick;
}
