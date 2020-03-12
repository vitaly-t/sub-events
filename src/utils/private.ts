/**
 * Implements proper private properties.
 */
export class Private<K extends object, V> {

    private propMap = new WeakMap<K, V>();

    get(obj: K): V {
        return this.propMap.get(obj)!;
    }

    set(obj: K, val: V) {
        this.propMap.set(obj, val);
    }
}
