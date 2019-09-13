Examples
--------

Practical examples of wrapping [hot observables] into [SubEvent]: 

* [from-emitter] - create [SubEvent] from [EventEmitter]
* [from-event] - create [SubEvent] from DOM [Event]
* [from-interval] - create [SubEvent] from a time interval

**NOTE:** These are all fully functioning examples, to be copied into your code whenever you need them.
But they are not included in distribution.

[from-interval]:./from-interval.ts
[from-emitter]:./from-emitter.ts
[from-event]:./from-event.ts
[EventEmitter]:https://nodejs.org/api/events.html#events_class_eventemitter
[Event]:https://developer.mozilla.org/en-US/docs/Web/API/Event
[SubEvent]:https://vitaly-t.github.io/sub-events/classes/subevent.html
[hot observables]:https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339
