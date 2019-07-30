import {Subscription} from './sub';

/**
 * Subscription Context Interface.
 */
export interface ISubContext<T, D = any> {
    readonly event: SubEvent<T>;
    readonly cb: SubFunction<T>;

    /**
     * Data of any/specified type to let the event wrapper propagate
     * any context it needs through the subscribe->cancel lifecycle.
     */
    data?: D;
}

/**
 * @interface IEventOptions
 * @description
 * Constructor options for the [[SubEvent]] class.
 */
export interface IEventOptions<T> {
    /**
     * Maximum number of subscribers that can receive data.
     * Default is 0, meaning `no limit applies`.
     */
    max?: number;

    /**
     * Subscription notification.
     */
    onSubscribe?: (ctx: ISubContext<T>) => void;

    /**
     * Subscription-cancel notification.
     */
    onCancel?: (ctx: ISubContext<T>) => void;
}

/**
 * Subscription callback function type.
 * @hidden
 */
export type SubFunction<T> = (data: T) => any;

/**
 * Internal structure for each subscriber.
 * @hidden
 */
export interface ISubscriber<T> extends ISubContext<T> {
    /**
     * Cancels the subscription.
     */
    cancel: () => void;
}

/**
 * @class
 * Implements subscribing to and triggering an event.
 */
export class SubEvent<T = any> {

    readonly options: IEventOptions<T>;

    /**
     * Internal list of subscribers.
     */
    protected _subs: ISubscriber<T>[] = [];

    /**
     * @constructor
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
     * @returns
     * Object for cancelling the subscription safely.
     */
    public subscribe(cb: SubFunction<T>): Subscription {
        const sub: ISubscriber<T> = {event: this, cb, cancel: null};
        this._subs.push(sub);
        if (typeof this.options.onSubscribe === 'function') {
            this.options.onSubscribe(sub);
        }
        return new Subscription(this._createCancel(sub), sub);
    }

    /**
     * Asynchronous data broadcast to all subscribers.
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
            sub.cb(data);
            if (index === r.length - 1 && typeof onFinished === 'function') {
                onFinished(r.length); // finished sending
            }
        }));
        return r.length;
    }

    /**
     * Safe asynchronous data broadcast to all subscribers.
     *
     * Errors from subscription callbacks are passed into the callback function,
     * which handles both synchronous and asynchronous subscription functions.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param onError
     * Callback for handling errors from the event subscribers.
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
                const res = sub.cb(data);
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
     * Synchronous data broadcast to all subscribers.
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
        r.forEach(sub => sub.cb(data));
        return r.length;
    }

    /**
     * Safe synchronous data broadcast to all subscribers.
     *
     * Errors from subscription callbacks are passed into the callback function,
     * which handles both synchronous and asynchronous subscription functions.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param onError
     * Callback for handling errors from subscribers.
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
                const res = sub.cb(data);
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
     * Current number of subscribers.
     */
    public get count(): number {
        return this._subs.length;
    }

    /**
     * Cancels all event subscriptions.
     *
     * @returns
     * Number of subscriptions cancelled.
     */
    public cancelAll(): number {
        const copy = typeof this.options.onCancel === 'function' ? [...this._subs] : [];
        const n = this._subs.length;
        this._subs.forEach(sub => sub.cancel());
        this._subs.length = 0;
        copy.forEach(c => this.options.onCancel(c));
        return n;
    }

    /**
     * Gets all recipients that must receive data.
     *
     * It returns a copy of subscribers array for safe iteration, while applying the
     * maximum limit when it is set with the [[max]] option.
     */
    protected _getRecipients(): ISubscriber<T>[] {
        const end = this.options.max > 0 ? this.options.max : this._subs.length;
        return this._subs.slice(0, end);
    }

    /**
     * Creates unsubscribe callback function for the [[Subscription]] class.
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
     *
     * @param sub
     * Subscriber to be removed, which must be on the list.
     */
    protected _cancelSub(sub: ISubscriber<T>) {
        this._subs.splice(this._subs.indexOf(sub), 1);
        sub.cancel();
        if (typeof this.options.onCancel === 'function') {
            this.options.onCancel(sub);
        }
    }

    /**
     * For compatibility with web browsers.
     */
    protected static _nextCall = typeof process === 'undefined' ? setTimeout : process.nextTick;
}
