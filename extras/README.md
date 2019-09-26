Extras
------

Extra recipes for creating [SubEvent] from popular hot observables:

<details>
<summary><b>From DOM Event</b></summary>
<br/>

Implemented in [src/from-event].
<br/>
```ts
import {fromEvent, fromSharedEvent} from 'sub-events/ext';

const onClick = fromEvent(document, 'click'); // creating 'click' event

const sub = onClick.subscribe((e:Event) => {
    // handling the 'click' event
});

sub.cancel(); // cancel subscription when no longer needed
```
And to share events across all subscribers, use `fromSharedEvent` instead.
</details>

<details>
<summary><b>From EventEmitter</b></summary><br/>

Implemented in [src/from-emitter].
<br/>
```ts
import {fromEmitter, fromSharedEmitter} from 'sub-events/ext';

const e = new EventEmitter(); // our test emitter

const onReceive = fromEmitter(e, 'receive'); // creating 'receive' event

const sub = onReceive.subscribe(([one, two, three]) => {
    // will get one = 1, two = 2, three = 3
});

e.emit('receive', 1, 2, 3); // source emitter sends data

sub.cancel(); // cancel subscription when no longer needed
```
And to share events across all subscribers, use `fromSharedEmitter` instead.
</details>

<details>
<summary><b>From Interval</b></summary><br/>

Implemented in [src/from-interval].
<br/>
```ts
import {fromInterval} from 'sub-events/ext';

const onInterval = fromInterval(1000); // creating interval event

const sub = onInterval.subscribe((count: number) => {
    // handling the interval event
});

sub.cancel(); // cancel subscription when no longer needed
```
And to share events across all subscribers, use `fromSharedInterval` instead.
</details>

<details>
<summary><b>From Timeout</b></summary><br/>

Implemented in [src/from-timeout].
<br/>
```ts
import {fromTimeout, TimeoutEvent} from 'sub-events/ext';

const onTimeout = fromTimeout(1000); // creating 1-second timeout event

const sub = onTimeout.subscribe(() => {
    // handling the timeout event
});

// Timeout event auto-cancels the subscription. You would only call
// 'cancel' yourself, if you want to stop the event from happening:
sub.cancel();
```

Function `fromTimeout` simply initiates and returns class `TimeoutEvent`,
which means you can alternatively do the same directly, like this:

```ts
const onTimeout = new TimeoutEvent(1000); // creating 1-second timeout event
```

</details>

[src/from-timeout]:./src/from-timeout.ts
[src/from-interval]:./src/from-interval.ts
[src/from-emitter]:./src/from-emitter.ts
[src/from-event]:./src/from-event.ts
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
