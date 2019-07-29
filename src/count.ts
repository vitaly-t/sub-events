import {IEventOptions, ISubscriber, SubEvent} from './event';

/**
 * @interface ICountChange
 * @description
 * Represents a change in the number of subscribers, as used with [[onCount]] event.
 */
export interface ICountChange {
    /**
     * New number of subscribers.
     */
    newCount: number;

    /**
     * Previous number of subscribers.
     */
    prevCount: number;
}

/**
 * @interface ICountOptions
 * @description
 * Constructor options for the [[SubCount]] class.
 */
export interface ICountOptions extends IEventOptions {
    /**
     * Makes [[onCount]] calls synchronous. Default is `false`.
     */
    sync?: boolean;
}

/**
 * @class
 * Extends [[SubEvent]] with [[onCount]] event to observe the number of subscriptions.
 */
export class SubCount<T = any> extends SubEvent<T> {
    protected _notify: (data: any) => number;

    /**
     * Notifies of any change in the number of subscribers.
     * @event
     */
    readonly onCount: SubEvent<ICountChange> = new SubEvent();

    /**
     * @constructor
     *
     * @param options
     * Configuration Options.
     */
    constructor(options?: ICountOptions) {
        super(options);
        const c = this.onCount;
        this._notify = (options && options.sync ? c.emitSync : c.emit).bind(c);
    }

    /**
     * Cancels all subscriptions.
     *
     * It overrides base implementation to trigger event [[onCount]]
     * when there is at least one subscribed client.
     */
    public cancelAll(): void {
        const prevCount = this.count;
        if (prevCount) {
            super.cancelAll();
            this._notify({newCount: 0, prevCount});
        }
    }

    /**
     * Overrides base implementation to trigger event [[onCount]] during
     * `subscribe` and `cancel` calls.
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
