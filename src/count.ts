import {IEmitOptions, ISubscriber, SubEvent} from './event';

/**
 * @interface ISubCountChange
 * @description
 * Represents a change in the number of subscriptions, as used with [[onCount]] event.
 */
export interface ISubCountChange {
    /**
     * New number of subscriptions.
     */
    newCount: number;

    /**
     * Previous number of subscriptions.
     */
    prevCount: number;
}

/**
 * @class SubEventCount
 * @description
 * Extends [[SubEvent]] with event [[onCount]], to observe the number of subscriptions.
 */
export class SubEventCount<T = unknown> extends SubEvent<T> {

    /**
     * @hidden
     */
    protected _notify: (data: ISubCountChange) => number;

    /**
     * Triggered on any change in the number of subscriptions.
     * @event onCount
     */
    readonly onCount: SubEvent<ISubCountChange> = new SubEvent();

    /**
     * @constructor
     * Event constructor.
     *
     * @param options
     * Configuration Options.
     */
    constructor(options?: IEmitOptions) {
        super();
        this._notify = (data: ISubCountChange) => this.onCount.emit(data, options);
    }

    /**
     * Cancels all event subscriptions.
     *
     * It overrides the base implementation to trigger event [[onCount]]
     * when there was at least one subscription.
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
