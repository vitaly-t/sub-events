# Strongly-Typed Events

Lightweight, strongly-typed events, with monitored subscriptions. 

* Documentation: [API] + [WiKi].
* Compatible with all existing events - see [Extras]. 

## Install

```sh
npm i sub-events
```

## Usage

* On event-provider side:

```ts
import {SubEvent} from 'sub-events';

// creating a strongly-typed event: 
const e: SubEvent<string> = new SubEvent();

// triggering the event when needed:
e.emit('hello');
```

**API:** [SubEvent], [emit]

* On event-consumer side:

```ts
// subscribing to the event:
const sub = e.subscribe((data: string) => {
  // data = 'hello'
});

// cancel the subscription when no longer needed:
sub.cancel();
```

**API:** [Subscription], [subscribe], [cancel]

### Monitoring Subscriptions

Class [SubEventCount] extends [SubEvent] with event [onCount], to observe the number of subscriptions:

```ts
import {SubEventCount, ISubCountChange} from 'sub-events';

// creating a strongly-typed event:
const e: SubEventCount<string> = new SubEventCount();

e.onCount.subscribe((info: ISubCountChange) => {
    // number of subscriptions has changed;
    // info = {newCount, prevCount} 
});

// any subscription will trigger event onCount:
const sub = e.subscribe(data => {});

// cancelling a subscription will trigger onCount:
sub.cancel();
``` 

**API:** [SubEventCount], [onCount]

### Browser

When including directly from HTML, you can access all types under `subEvents` namespace:

```html
<script src="./node_modules/sub-events/dist"></script>
<script>
    const e = new subEvents.SubEvent();
    e.subscribe(data => {
        // data received
    });
</script>
``` 

Note that pre-built script includes only the core library, without the [Extras],
which you can bundle yourself as needed. 

[Extras]:https://github.com/vitaly-t/sub-events/tree/master/extras
[API]:https://vitaly-t.github.io/sub-events
[WiKi]:https://github.com/vitaly-t/sub-events/wiki
[Subscription]:https://vitaly-t.github.io/sub-events/classes/subscription.html
[subscribe]:https://vitaly-t.github.io/sub-events/classes/subevent.html#subscribe
[cancel]:https://vitaly-t.github.io/sub-events/classes/subscription.html#cancel
[emit]:https://vitaly-t.github.io/sub-events/classes/subevent.html#emit
[onCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html#oncount
[Extras]:https://github.com/vitaly-t/sub-events/wiki/Extras
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
[SubEventCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html
