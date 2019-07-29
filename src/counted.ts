import {IObservableOptions, ISubscriber, Observable} from './observable';

/**
 * @interface ISubCounts
 * @description
 * Represents a change in the number of subscribers, as used with [[onCount]] event.
 */
export interface ISubCounts {
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
 * @interface ICountedOptions
 * @description
 * Constructor options for the [[CountedObservable]] class.
 */
export interface ICountedOptions extends IObservableOptions {
    /**
     * Makes [[onCount]] calls synchronous. Default is `false`.
     */
    sync?: boolean;
}

/**
 * @class
 * Extends [[Observable]] with [[onCount]] event to monitor subscriptions count.
 */
export class CountedObservable<T = any> extends Observable<T> {
    protected _notify: (data: any) => number;

    /**
     * Notifies of any change in the number of subscribers.
     * @event
     */
    readonly onCount: Observable<ISubCounts> = new Observable();

    /**
     * @param options
     * Configuration Options.
     */
    constructor(options?: ICountedOptions) {
        super(options);
        const c = this.onCount;
        this._notify = (options && options.sync ? c.nextSync : c.next).bind(c);
    }

    /**
     * Unsubscribes all clients.
     *
     * It overrides base implementation to trigger event [[onCount]]
     * when there is at least one subscribed client.
     */
    public unsubscribeAll(): void {
        const prevCount = this.count;
        if (prevCount) {
            super.unsubscribeAll();
            this._notify({newCount: 0, prevCount});
        }
    }

    /**
     * Overrides base implementation to trigger event [[onCount]] during
     * `subscribe` and `unsubscribe` calls.
     */
    protected _createUnsub(sub: ISubscriber<T>): () => void {
        const s = this._subs;
        this._notify({newCount: s.length, prevCount: s.length - 1});
        return () => {
            this._removeSub(sub);
            this._notify({newCount: s.length, prevCount: s.length + 1});
        };
    }
}
