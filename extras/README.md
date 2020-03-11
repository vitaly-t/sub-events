Extras
------

Extra recipes for creating [SubEvent] from popular event sources. They are all available
from sub-path `sub-events/ext`, or via individual files, if you want to bundle them based on usage.

These represent essential hands-on examples of wrapping well-known types of events, based on which you can
easily do the same for any other events or resources in your project.

<details>
<summary><b>From DOM Event</b></summary>
<br/>

Implemented in [src/from-event].
<br/>
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
<summary><b>From EventEmitter</b></summary><br/>

Implemented in [src/from-emitter].
<br/>
```ts
import {fromEmitter} from 'sub-events/ext';

const e = new EventEmitter(); // our source/test emitter

const onReceive = fromEmitter<string>(e, 'receive'); // creating 'receive' event

const sub = onReceive.subscribe((message: string) => {
    // message = 'hello!'
});

e.emit('receive', 'hello!'); // source emitter sends data

sub.cancel(); // cancel subscription when no longer needed
```

For multi-argument events, use `fromEmitterArgs` instead, which accepts a tuple
type for the event arguments:

```ts
import {fromEmitterArgs} from 'sub-events/ext';

const e = new EventEmitter(); // our source/test emitter

type MyTuple = [number, string];

const onReceive = fromEmitterArgs<MyTuple>(e, 'receive'); // creating 'receive' event

const sub = onReceive.subscribe(data => {
    // data[0] = 123, strongly-typed
    // data[1] = 'hello', strongly-typed
});

e.emit('receive', 123, 'hello'); // source emitter sends multiple arguments

sub.cancel(); // cancel subscription when no longer needed
```

</details>

<details>
<summary><b>From Interval</b></summary><br/>

Implemented in [src/from-interval].
<br/>
```ts
import {fromInterval} from 'sub-events/ext';

const onInterval = fromInterval(1000); // creating 1-second interval event

const sub = onInterval.subscribe(() => {
    // handling the interval event
});

sub.cancel(); // cancel subscription when no longer needed
```

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

All that function `fromTimeout` does - creates and returns class `TimeoutEvent`,
which means you can do the same:

```ts
const onTimeout = new TimeoutEvent(1000); // the same result
```

</details>

[src/from-timeout]:./src/from-timeout.ts
[src/from-interval]:./src/from-interval.ts
[src/from-emitter]:./src/from-emitter.ts
[src/from-event]:./src/from-event.ts
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
