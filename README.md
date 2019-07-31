# sub-events

[![Build Status](https://travis-ci.org/vitaly-t/sub-events.svg?branch=master)](https://travis-ci.org/vitaly-t/sub-events)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/sub-events/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/sub-events?branch=master)

Easy event subscription, implemented in TypeScript.

Supports all versions of Node.js and web browsers.

## Install

```sh
npm i sub-events
```

## Usage

* On provider side:

```ts
import {SubEvent} from 'sub-events';

// creating a strict-type event: 
const e: SubEvent<string> = new SubEvent();

// triggering the event when needed:
e.emit('hello');
```

**API:** [SubEvent], [emit], [emitSync], [emitSafe], [emitSyncSafe]

* On consumer side:

```ts
// subscribing to the event:
const sub = e.subscribe((data: string) => {
  // data = 'hello'
});

// cancel the subscription when no longer needed:
sub.cancel();
```

**API:** [Subscription], [subscribe], [cancel]

### Observing Subscriptions

Class [SubEventCount] extends [SubEvent] with event [onCount], to observe the number of live subscriptions:

```ts
import {SubEventCount, ISubCountChange} from 'sub-events';

// creating a strict-type event:
const e: SubEventCount<string> = new SubEventCount();
```

Monitor the number of subscriptions:

```ts
const monSub = e.onCount.subscribe((info: ISubCountChange) => {
    // number of subscriptions has changed;
    // info = {newCount, prevCount} 
});

// cancel monitoring when no longer needed: 
monSub.cancel();
``` 

**API:** [SubEventCount], [onCount]

### Browser

When using directly inside HTML, you can access all types under `subEvents` namespace:

```html
<script src="./node_modules/sub-events/dist"></script>
<script>
    const e = new subEvents.SubEvent();
    e.subscribe(data => {
        // data received
    });
</script>
``` 

But with TypeScript, you can bundle the code any way you want.

**See Also:**

* [Extras] for a practical example.
* [API Documentation](https://vitaly-t.github.io/sub-events).

[Subscription]:https://vitaly-t.github.io/sub-events/classes/subscription.html
[subscribe]:https://vitaly-t.github.io/sub-events/classes/subevent.html#subscribe
[cancel]:https://vitaly-t.github.io/sub-events/classes/subscription.html#cancel
[emit]:https://vitaly-t.github.io/sub-events/classes/subevent.html#emit
[emitSync]:https://vitaly-t.github.io/sub-events/classes/subevent.html#emitsync
[emitSafe]:https://vitaly-t.github.io/sub-events/classes/subevent.html#emitsafe
[emitSyncSafe]:https://vitaly-t.github.io/sub-events/classes/subevent.html#emitsyncsafe
[onCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html#oncount
[Extras]:https://github.com/vitaly-t/sub-events/wiki/Extras
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
[SubEventCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html
