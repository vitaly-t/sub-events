Extras
------

Extra recipes for creating [SubEvent] from popular hot observables: 

* [from-event] - create [SubEvent] from DOM [Event]
* [from-emitter] - create [SubEvent] from [EventEmitter]
* [from-interval] - create [SubEvent] from a time interval
* [from-timeout] - create [SubEvent] from a time-out

All these reside inside `ext` sub-path, as shown below:

* TypeScript

```ts
import {fromEvent, fromEmitter} from 'sub-events/ext';
```

* Node.js

```js
const {fromInterval, fromTimeout} = require('sub-events/ext');
```

For more examples, see [WiKi] pages.

[WiKi]:https://github.com/vitaly-t/sub-events/wiki
[from-timeout]:./src/from-timeout.ts
[from-interval]:./src/from-interval.ts
[from-emitter]:./src/from-emitter.ts
[from-event]:./src/from-event.ts
[EventEmitter]:https://nodejs.org/api/events.html#events_class_eventemitter
[Event]:https://developer.mozilla.org/en-US/docs/Web/API/Event
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
