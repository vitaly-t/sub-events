/**
 * @class
 * Represents result of subscribing to an observable object, and a safe way to unsubscribe.
 */
export class Subscription {
    private _unsub: () => void;

    /**
     * @hidden
     */
    constructor(unsub: () => void, sub: { cancel: () => void }) {
        this._unsub = unsub;
        sub.cancel = () => {
            // Observable cancels this subscription:
            this._unsub = null;
        };
    }

    /**
     * Indicates whether the subscription is live / active.
     *
     * It can be useful for subscribers when [[unsubscribe]] or [[unsubscribeAll]]
     * are used without their knowledge.
     */
    public get live(): boolean {
        return !!this._unsub;
    }

    /**
     * Cancels the live subscription.
     *
     * @returns
     * - `true` - subscription has been successfully cancelled
     * - `false` - nothing happened, as subscription wasn't live
     */
    public unsubscribe(): boolean {
        if (this._unsub) {
            this._unsub();
            this._unsub = null; // to protect from repeated calls
            return true;
        }
        return false;
    }

}
