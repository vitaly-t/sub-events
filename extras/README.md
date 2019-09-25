Extras
------

Extra recipes for creating [SubEvent] from popular hot observables: 

* [src/from-event] - create [SubEvent] from DOM [Event]
* [src/from-emitter] - create [SubEvent] from [EventEmitter]
* [src/from-interval] - create [SubEvent] from a time interval
* [src/from-timeout] - create [SubEvent] from a time-out

All these reside inside `ext` sub-path, as shown below:

* TypeScript

```ts
import {fromEvent, fromEmitter} from 'sub-events/ext';
```

* Node.js

```js
const {fromInterval, fromTimeout} = require('sub-events/ext');
```

Or you can include individual files, if you want to bundle only what's used.

[WiKi]:https://github.com/vitaly-t/sub-events/wiki
[src/from-timeout]:./src/from-timeout.ts
[src/from-interval]:./src/from-interval.ts
[src/from-emitter]:./src/from-emitter.ts
[src/from-event]:./src/from-event.ts
[EventEmitter]:https://nodejs.org/api/events.html#events_class_eventemitter
[Event]:https://developer.mozilla.org/en-US/docs/Web/API/Event
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
