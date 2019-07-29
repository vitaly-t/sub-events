import {Subscription} from './sub';

/**
 * @interface IEventOptions
 * @description
 * Constructor options for the [[SubEvent]] class.
 */
export interface IEventOptions {
    /**
     * Maximum number of subscribers that can receive data.
     * Default is 0, meaning `no limit applies`.
     */
    max?: number;
}

/**
 * Subscription callback function type.
 * @hidden
 */
export type SubFunction<T> = (data: T) => any;

/**
 * Subscriber details.
 * @hidden
 */
export interface ISubscriber<T> {

    /**
     * Subscription callback function.
     */
    cb: SubFunction<T>;

    /**
     * Cancels the subscription.
     */
    cancel: () => void;
}

/**
 * @class
 * Implements subscribing to events and triggering them.
 */
export class SubEvent<T = any> {

    /**
     * Maximum number of subscribers that can receive data.
     * 0 = `no limit applies`.
     */
    readonly max: number;

    /**
     * Internal list of subscribers.
     */
    protected _subs: ISubscriber<T>[] = [];

    /**
     * @param options
     * Configuration Options.
     */
    constructor(options?: IEventOptions) {
        this.max = options && options.max > 0 ? options.max : 0;
    }

    /**
     * Subscribes to receive all data events.
     *
     * @param cb
     * Data notification callback function.
     *
     * @returns
     * Object for unsubscribing safely.
     */
    public subscribe(cb: SubFunction<T>): Subscription {
        const sub: ISubscriber<T> = {cb, cancel: null};
        this._subs.push(sub);
        return new Subscription(this._createUnsub(sub), sub);
    }

    /**
     * Asynchronous data broadcast to all subscribers.
     *
     * @param data
     * Data to be sent, according to the type template.
     *
     * @param cb
     * Optional callback function to be notified when the last recipient has received the data.
     * The function takes one parameter - total number of clients that received the data.
     * Note that asynchronous subscribers may still be processing the data at this point.
     *
     * @returns
     * Number of clients that will be receiving the data.
     */
    public next(data: T, cb?: (count: number) => void): number {
        const r = this._getRecipients();
        r.forEach((sub, index) => SubEvent._nextCall(() => {
            sub.cb(data);
            if (index === r.length - 1 && typeof cb === 'function') {
                cb(r.length); // finished sending
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
     * Callback for handling errors from subscribers.
     *
     * @returns
     * Number of clients that will be receiving the data.
     */
    public nextSafe(data: T, onError: (err: any) => void): number {
        const r = this._getRecipients();
        r.forEach(sub => SubEvent._nextCall(() => {
            try {
                const res = sub.cb(data);
                if (res && typeof res.catch === 'function') {
                    res.catch(onError);
                }
            } catch (e) {
                onError(e);
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
    public nextSync(data: T): number {
        const r = this._getRecipients();
        r.forEach(sub => sub.cb(data));
        return r.length;
    }

    /**
     * Current number of subscribers.
     */
    public get count(): number {
        return this._subs.length;
    }

    /**
     * Unsubscribes all clients.
     */
    public unsubscribeAll(): void {
        this._subs.forEach(sub => sub.cancel());
        this._subs.length = 0;
    }

    /**
     * Gets all recipients that must receive data.
     *
     * It returns a copy of subscribers array for safe iteration, while applying the
     * maximum limit when it is set with the [[max]] option.
     */
    protected _getRecipients(): ISubscriber<T>[] {
        const end = this.max ? this.max : this._subs.length;
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
    protected _createUnsub(sub: ISubscriber<T>): () => void {
        return () => {
            this._removeSub(sub);
        };
    }

    /**
     * Removes an existing subscriber from the list.
     *
     * @param sub
     * Subscriber to be removed, which must be on the list.
     */
    protected _removeSub(sub: ISubscriber<T>) {
        const idx = this._subs.indexOf(sub);
        this._subs[idx].cancel();
        this._subs.splice(idx, 1);
    }

    /**
     * For compatibility with web browsers.
     */
    protected static _nextCall = typeof process === 'undefined' ? setTimeout : process.nextTick;
}
