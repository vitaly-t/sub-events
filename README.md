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

* On the provider side:

```ts
import {SubEvent} from 'sub-events';

// creating with the event's data type: 
const e: SubEvent<string> = new SubEvent();

// trigerring the event when needed:
e.emit('hello');
```

* On the consumer side:

```ts
// subscribing to the event:
const sub = e.subscribe((data: string) => {
  // data = 'hello'
});

// cancel the subscription when no longer needed:
sub.cancel();
```

### Observing Subscriptions

Class [SubEventCount] extends [SubEvent] with event [onCount] to observe the number of subscriptions:

```ts
import {SubEventCount, ISubCountChange} from 'sub-events';

// creating with the event's data type:
const e: SubEventCount<string> = new SubEventCount();
```

Any side can monitor the number of subscriptions:

```ts
const monSub = e.onCount.subscribe((info: ISubCountChange) => {
    // number of subscriptions has changed;
    // info = {newCount, prevCount} 
});

// cancel the monitoring when no longer needed: 
monSub.cancel();
``` 

### Browser

Including `./sub-events/dist` in your HTML will give you access to all types under `subEvents` namespace:

```html
<script src="./node_modules/sub-events/dist"></script>
<script>
    const e = new subEvents.SubEvent();
    e.subscribe(data => {
        // data received
    });
</script>
``` 

And when using it directly in TypeScript, you can compile and bundle it any way you want.

**Example:**

Simplified event wrapping example. See [extras] for a more complete example.

```ts
function fromEvent(source: Node, event: string): SubEvent<Event> {
    const sub = new SubEvent<Event>();
    source.addEventListener(event, e => sub.emit(e));
    return sub;
}

fromEvent(document, 'click').subscribe((e: Event) => {
    // handle click events from the document
});
```

See also: [code-generated API](https://vitaly-t.github.io/sub-events).

[onCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html#oncount
[extras]:https://github.com/vitaly-t/sub-events/blob/master/src/extras.ts
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
[SubEventCount]:https://vitaly-t.github.io/sub-events/classes/subeventcount.html
