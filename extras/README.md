Extras
------

Extra recipes for creating [SubEvent] from popular hot observables:

<details>
<summary><b>From DOM Event</b> (source in [src/from-event.ts])</summary>

```ts
import {fromEvent} from 'sub-events/ext';

const onClick = fromEvent(document, 'click'); // creating 'click' event

const sub = onClick.subscribe((e:Event) => {
    // handling the 'click' event
});

sub.cancel(); // cancel subscription when no longer needed
```
</details>

<details>
<summary><b>From EventEmitter</b> (source in [src/from-emitter.ts])</summary>

```ts
import {fromEmitter} from 'sub-events/ext';

const e = new EventEmitter(); // our test emitter

const onReceive = fromEmitter(e, 'receive'); // creating 'receive' event

const sub = onReceive.subscribe(([one, two, three]) => {
    // will get one = 1, two = 2, three = 3
});

e.emit('receive', 1, 2, 3); // source emitter sends data

sub.cancel(); // cancel subscription when no longer needed
```
</details>

<details>
<summary><b>From Interval</b> (source in [src/from-interval.ts])</summary>

```ts
import {fromInterval} from 'sub-events/ext';

const onInterval = fromInterval(1000); // creating interval event

const sub = onInterval.subscribe((count: number) => {
    // handling the interval event
});

sub.cancel(); // cancel subscription when no longer needed
```
</details>

<details>
<summary><b>From Timeout</b> (source in [src/from-timeout.ts])</summary>

```ts
import {fromTimeout, TimeoutEvent} from 'sub-events/ext';

const onTimeout: TimeoutEvent = fromTimeout(1000); // creating 1-second timeout event

const sub = onTimeout.subscribe(() => {
    // handling the timeout event
});

// Timeout event auto-cancels the subscription. You would only call
// 'cancel' yourself, if you want to stop the event from happening:
sub.cancel();
```
</details>


[WiKi]:https://github.com/vitaly-t/sub-events/wiki
[src/from-timeout]:./src/from-timeout.ts
[src/from-interval]:./src/from-interval.ts
[src/from-emitter]:./src/from-emitter.ts
[src/from-event]:./src/from-event.ts
[EventEmitter]:https://nodejs.org/api/events.html#events_class_eventemitter
[Event]:https://developer.mozilla.org/en-US/docs/Web/API/Event
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
