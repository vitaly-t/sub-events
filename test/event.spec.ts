import {chai, dummy, expect} from './';
import {EmitSchedule, EventConsumer, ISubContext, SubEvent} from '../src';

const errInvalidOptions = `Invalid "options" parameter.`;

describe('SubEvent', () => {
    it('must throw on invalid options', () => {
        expect(() => {
            new SubEvent(0 as any);
        }).to.throw(errInvalidOptions);
    });
    it('must initialize correctly', () => {
        const a = new SubEvent();
        expect(a.count).to.eq(0);
        expect(a.maxSubs).to.eq(0);
    });
    it('must invoke subscription functions', done => {
        const a = new SubEvent<number>();
        const cb = () => 1;
        const s = chai.spy(cb);
        a.subscribe(s);
        a.emit(123, {
            onFinished: (count: number) => {
                expect(count).to.be.eq(1);
                expect(s).to.have.been.called.with(123);
                done();
            },
            schedule: EmitSchedule.async
        });
    });
    it('must cease async notifications when cancelled', done => {
        const a = new SubEvent<number>();
        const values: number[] = [];
        const sub = a.subscribe((value: number) => {
            values.push(value);
            sub.cancel();
        });
        a.emit(1, {schedule: EmitSchedule.async});
        a.emit(2, {schedule: EmitSchedule.async});
        a.emit(3, {schedule: EmitSchedule.async, onError: dummy});
        setTimeout(() => {
            expect(values).to.eql([1]);
            done();
        });
    });
    it('must track subscription count', () => {
        const a = new SubEvent();
        expect(a.count).to.eq(0);
        const sub1 = a.subscribe(() => 1);
        expect(a.count).to.eq(1);
        const sub2 = a.subscribe(() => 2);
        expect(a.count).to.eq(2);
        sub1.cancel();
        expect(a.count).to.eq(1);
        sub2.cancel();
        expect(a.count).to.eq(0);
    });
    it('must track subscription live status', () => {
        const a = new SubEvent();
        const sub = a.subscribe(() => 1);
        expect(sub.live).to.be.true;
        sub.cancel();
        expect(sub.live).to.be.false;
    });
    it('must limit notifications according to the maxSubs option', () => {
        const a = new SubEvent<number>({maxSubs: 1});
        const cb1 = () => 1;
        const cb2 = () => 2;
        const s1 = chai.spy(cb1);
        const s2 = chai.spy(cb2);
        a.subscribe(s1);
        a.subscribe(s2);
        expect(a.maxSubs).to.eq(1);
        expect(a.count).to.eq(2);
        a.emit(123, {
            onFinished: (count: number) => {
                expect(count).to.be.eq(1);
                expect(s1).to.have.been.called.with(123);
                expect(s2).to.not.have.been.called;
            }
        });
    });
    it('must call onCancel during cancellation', () => {
        let data, called = false;
        const onSubscribe = (ctx: ISubContext) => {
            ctx.data = 123;
        };
        const onCancel = (ctx: ISubContext) => {
            data = ctx.data;
            called = true;
        };
        const a = new SubEvent({onSubscribe, onCancel});
        const sub = a.subscribe(dummy, {name: 'tst'});
        expect(called).to.be.false;
        sub.cancel();
        expect(called).to.be.true;
        expect(data).to.eq(123);
        expect(sub.name).to.eq('tst');
    });
    it('must call onFinish when done', done => {
        let count: number;
        const a = new SubEvent<string>();
        a.subscribe(dummy);
        a.subscribe(dummy);
        const onFinished = (c: number) => {
            count = c;
        };
        const handler = chai.spy(onFinished);
        a.emit('hello', {onFinished: handler});
        setTimeout(() => {
            expect(handler).to.have.been.called.once;
            expect(count).to.eq(2);
            done();
        });
    });

});

describe('subscribe', () => {
    it('must throw on invalid options', () => {
        const s = new SubEvent();
        expect(() => {
            s.subscribe(dummy, 0 as any);
        }).to.throw(errInvalidOptions);
    });
    it('must pass subscription options correctly', () => {
        const a = new SubEvent<void>();
        let context;

        function onEvent(this: any) {
            context = this;
        }

        const sub = a.subscribe(onEvent, {thisArg: a, name: 'my-sub'});
        a.emit();
        expect(context).to.eq(a);
        expect(sub.name).to.eq('my-sub');
    });
    it('must call onSubscribe when specified', () => {
        let context: ISubContext | undefined;
        const onSubscribe = (ctx: ISubContext) => {
            context = ctx;
        };
        const a = new SubEvent({onSubscribe});
        expect(context).to.be.undefined;
        a.subscribe(dummy, {name: 'hello'});
        expect(!!context).to.be.true;
        if (context) {
            expect(context.name).to.eq('hello');
        }
    });
});

describe('cancelAll', () => {
    it('must cancel all current subscriptions', () => {
        const received: string[] = [];
        const a = new SubEvent<string>();
        const sub = a.subscribe(value => {
            received.push(value);
        });
        a.emit('first');
        a.cancelAll();
        a.emit('second');
        expect(received).to.eql(['first']);
        expect(sub.live).to.be.false;
    });
    it('must invoke onCancel for each subscription', () => {
        let data;
        const onSubscribe = (ctx: ISubContext<string>) => {
            ctx.data = 123;
        };
        const onCancel = (ctx: ISubContext<string>) => {
            data = ctx.data;
        };
        const a = new SubEvent<string>({onSubscribe, onCancel});
        a.subscribe(dummy);
        expect(data).to.be.undefined;
        a.cancelAll();
        expect(data).to.eq(123);
    });
    it('must invoke onCancel once when specified', done => {
        const a = new SubEvent();
        let invoked = 0;
        a.subscribe(dummy, {
            onCancel: () => {
                invoked++;
            }
        });
        a.cancelAll();
        a.cancelAll();
        setTimeout(() => {
            expect(invoked).to.equal(1);
            done();
        });
    });
});

describe('getStat', () => {
    it('must report all subscriptions correctly', () => {
        const a = new SubEvent();
        a.subscribe(dummy);
        a.subscribe(dummy);
        a.subscribe(dummy, {name: 'first'});
        a.subscribe(dummy, {name: 'second'});
        a.subscribe(dummy, {name: 'third'});
        a.subscribe(dummy, {name: 'third'});
        expect(a.getStat()).to.eql({
            named: {
                first: 1,
                second: 1,
                third: 2
            },
            unnamed: 2
        });
    });
    it('must limit occurrences according to minUse option', () => {
        const a = new SubEvent();
        a.subscribe(dummy, {name: 'first'});
        a.subscribe(dummy, {name: 'second'});
        a.subscribe(dummy, {name: 'second'});
        expect(a.getStat({minUse: 2})).to.eql({
            named: {
                second: 2
            },
            unnamed: 0
        });
    });
});

describe('emit', () => {
    it('must return itself', () => {
        const e = new SubEvent<void>();
        expect(e.emit()).to.equal(e);
    });
    it('must throw on invalid options', () => {
        const s = new SubEvent();
        expect(() => {
            s.emit(null, 0 as any);
        }).to.throw(errInvalidOptions);
    });
    describe('with error handler', () => {
        const err = new Error('Ops!');
        it('must handle errors from synchronous subscribers', done => {
            const a = new SubEvent();
            a.subscribe(() => {
                throw err;
            }, {name: 'sync-test'});
            const handler = () => 1;
            const onError = chai.spy(handler);
            a.emit(123, {onError});
            setTimeout(() => {
                expect(onError).to.have.been.called.with(err, 'sync-test');
                done();
            });
        });
        it('must handle errors from asynchronous subscribers', done => {
            const a = new SubEvent();
            a.subscribe(async () => {
                throw err;
            }, {name: 'async-test'});
            const handler = () => 1;
            const onError = chai.spy(handler);
            a.emit(123, {onError, schedule: EmitSchedule.async});
            setTimeout(() => {
                expect(onError).to.have.been.called.with(err, 'async-test');
                done();
            });
        });
        it('must call onFinished once in the end', done => {
            const a = new SubEvent<number>();
            let count = 0;
            a.subscribe(dummy);
            const onFinished = (c: number) => {
                count = c;
            };
            const handler = chai.spy(onFinished);
            a.emit(123, {onFinished: handler});
            setTimeout(() => {
                expect(handler).to.have.been.called.once;
                expect(count).to.eq(1);
                done();
            });
        });
    });
    describe('sync with error handler', () => {
        it('must send data to all clients', () => {
            const a = new SubEvent<number>();
            let res = 0;
            a.subscribe(data => {
                res += data;
            });
            a.subscribe(data => {
                res += data;
            });
            a.emit(3, {onError: dummy});
            expect(res).to.eq(6);
        });
        const err = new Error('Ops!');
        it('must handle errors from synchronous subscribers', () => {
            const a = new SubEvent();
            a.subscribe(() => {
                throw err;
            }, {name: 'ops-cause'});
            const handler = () => 1;
            const onError = chai.spy(handler);
            a.emit(123, {onError});
            expect(onError).to.have.been.called.with(err, 'ops-cause');
        });
        it('must handle errors from asynchronous subscribers', done => {
            const b = new SubEvent();
            b.subscribe(async () => {
                return Promise.reject(err);
            });
            const handler = () => 1;
            const onError = chai.spy(handler);
            b.emit(123, {onError, schedule: EmitSchedule.async});
            setTimeout(() => {
                expect(onError).to.have.been.called.with(err);
                done();
            }, 10);
        });
    });
    describe('next', () => {
        it('must delay event broadcast', async () => {
            const e = new SubEvent<number>();
            e.emit(123, {schedule: EmitSchedule.next});
            const data = await e.toPromise({timeout: 0});
            expect(data).to.equal(123);
        });
    });
    describe('async', () => {
        it('must delay event broadcast', async () => {
            const e = new SubEvent<number>();
            e.emit(123, {schedule: EmitSchedule.async});
            const data = await e.toPromise({timeout: 0});
            expect(data).to.equal(123);
        });
    });
});

describe('toPromise', () => {
    it('must throw on invalid options', () => {
        const a = new SubEvent();
        expect(() => {
            a.toPromise(0 as any);
        }).to.throw(errInvalidOptions);
    });
    it('must resolve normally', async () => {
        const a = new SubEvent<number>();
        setTimeout(() => {
            a.emit(123);
        });
        expect(await a.toPromise()).to.equal(123);
    });
    it('must resolve when before timeout', async () => {
        const a = new SubEvent<number>();
        setTimeout(() => {
            a.emit(456);
        });
        expect(await a.toPromise({timeout: 10})).to.equal(456);
    });
    it('must reject on timeout', async () => {
        const a = new SubEvent<number>();
        let err: any;
        try {
            await a.toPromise({timeout: 0});
        } catch (e) {
            err = e;
        }
        expect(err && err.message).to.equal('Event timed out.');
    });
    it('must reject on timeout, with name', async () => {
        const a = new SubEvent<number>();
        let err: any;
        try {
            await a.toPromise({name: 'first', timeout: 10});
        } catch (e) {
            err = e;
        }
        expect(err && err.message).to.equal('Event "first" timed out.');
    });
    it('must reject when cancelled with timer', async () => {
        const a = new SubEvent<number>();
        let err: any;
        try {
            setTimeout(() => {
                a.cancelAll();
            });
            await a.toPromise({timeout: 10});
        } catch (e) {
            err = e;
        }
        expect(err && err.message).to.equal('Event cancelled.');
    });
    it('must reject when cancelled without timer', async () => {
        const a = new SubEvent<number>();
        let err: any;
        try {
            setTimeout(() => {
                a.cancelAll();
            });
            await a.toPromise();
        } catch (e) {
            err = e;
        }
        expect(err && err.message).to.equal('Event cancelled.');
    });

    it('must reject when cancelled, with name', async () => {
        const a = new SubEvent();
        let err: any;
        try {
            setTimeout(() => {
                a.cancelAll();
            }, 10);
            await a.toPromise({name: 'second', timeout: 1000});
        } catch (e) {
            err = e;
        }
        expect(err && err.message).to.equal('Event "second" cancelled.');
    });
});

describe('once', () => {
    it('must cancel subscription before the callback', () => {
        const a = new SubEvent<string>();
        let liveEnd, msg;
        const sub = a.once(data => {
            liveEnd = sub.live; // must be cancelled at this point
            msg = data;
        });
        const liveStart = sub.live;
        a.emit('hello');
        expect(msg).to.equal('hello');
        expect(liveStart).to.be.true;
        expect(liveEnd).to.be.false;
    });
    it('must pass in options correctly', () => {
        const a = new SubEvent<string>();
        const contextIn = 123;
        let contextOut: any;
        a.once(function (this: number) {
            contextOut = this;
        }, {thisArg: contextIn});
        a.emit('hello');
        expect(contextOut).to.equal(contextIn);
    });
});

describe('toConsumer', () => {
    it('must return new EventConsumer', () => {
        const e = new SubEvent<number>();
        const c = e.toConsumer();
        expect(c).to.be.instanceOf(EventConsumer);
        expect(typeof c.subscribe).to.equal('function');
        expect((c as any).emit).to.be.undefined;
        expect((c as any).cancelAll).to.be.undefined;
    });
});

describe('lastEvent', () => {
    it('must be set once emission finished', done => {
        const e = new SubEvent<number>();
        e.subscribe(dummy);

        const onFinished = (count: number) => {
            expect(e.lastEvent).to.eq(123);
        };

        const handler = chai.spy(onFinished);
        e.emit(123, {onFinished: handler, schedule: EmitSchedule.async});
        expect(e.lastEvent).to.be.undefined;

        setTimeout(() => {
            expect(handler).to.have.been.called.with(1);
            done();
        });
    });
});
