/**
 * @class
 * Represents an event subscription, and a safe way to cancel it.
 */
export class Subscription {
    private _unsub: () => void;

    /**
     * @hidden
     */
    constructor(unsub: () => void, sub: { cancel: () => void }) {
        this._unsub = unsub;
        sub.cancel = () => {
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
    public cancel(): boolean {
        if (this._unsub) {
            this._unsub();
            this._unsub = null;
            return true;
        }
        return false;
    }

}
