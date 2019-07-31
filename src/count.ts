import {IEventOptions, ISubscriber, SubEvent} from './event';

/**
 * @interface ISubCountChange
 * @description
 * Represents a change in the number of live subscriptions, as used with [[onCount]] event.
 */
export interface ISubCountChange {
    /**
     * New number of live subscriptions.
     */
    newCount: number;

    /**
     * Previous number of live subscriptions.
     */
    prevCount: number;
}

/**
 * @interface ICountOptions
 * @description
 * Constructor options for [[SubEventCount]] class.
 */
export interface ICountOptions<T> extends IEventOptions<T> {
    /**
     * Makes [[onCount]] calls synchronous. Default is `false`.
     */
    sync?: boolean;
}

/**
 * @class SubEventCount
 * @description
 * Extends [[SubEvent]] with event [[onCount]], to observe the number of live subscriptions.
 */
export class SubEventCount<T = unknown> extends SubEvent<T> {

    /**
     * @hidden
     */
    protected _notify: (data: ISubCountChange) => void;

    /**
     * Notifies of any change in the number of live subscriptions.
     * @event onCount
     */
    readonly onCount: SubEvent<ISubCountChange> = new SubEvent();

    /**
     * @constructor
     *
     * @param options
     * Configuration Options.
     */
    constructor(options?: ICountOptions<T>) {
        super(options);
        const c = this.onCount;
        this._notify = (options && options.sync ? c.emitSync : c.emit).bind(c);
    }

    /**
     * Cancels all event subscriptions.
     *
     * It overrides the base implementation to trigger event [[onCount]]
     * when there is at least one live subscription.
     *
     * @returns
     * Number of subscriptions cancelled.
     */
    public cancelAll(): number {
        const prevCount = this.count;
        if (prevCount) {
            super.cancelAll();
            this._notify({newCount: 0, prevCount});
        }
        return prevCount;
    }

    /**
     * Overrides base implementation to trigger event [[onCount]] during
     * `subscribe` and `cancel` calls.
     * @hidden
     */
    protected _createCancel(sub: ISubscriber<T>): () => void {
        const s = this._subs;
        this._notify({newCount: s.length, prevCount: s.length - 1});
        return () => {
            this._cancelSub(sub);
            this._notify({newCount: s.length, prevCount: s.length + 1});
        };
    }
}
