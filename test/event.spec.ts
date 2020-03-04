import {chai, expect} from './';
import {EmitSchedule, ISubContext, SubEvent} from '../src';

const dummy = () => {
};

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
    it('must call onSubscribe during subscription', () => {
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
    describe('emit with error handler', () => {
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
    describe('sync emit with error handler', () => {
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
    describe('next emit', () => {
        it('must delay event broadcast', done => {
            let res: string | null = null;
            const e = new SubEvent<string>();
            e.subscribe(data => {
                res = data;
            });
            e.emit('hello', {
                schedule: EmitSchedule.next,
                onFinished: () => {
                    expect(res).to.eql('hello');
                    done();
                }
            });
            expect(res).to.be.null;
        });
    });

    describe('subscribe', () => {
        it('must throw on invalid options', () => {
            const s = new SubEvent();
            expect(() => {
                s.subscribe(dummy, 0 as any);
            }).to.throw(errInvalidOptions);
        });
    });

    describe('emit', () => {
        it('must throw on invalid options', () => {
            const s = new SubEvent();
            expect(() => {
                s.emit(null, 0 as any);
            }).to.throw(errInvalidOptions);
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
            let err;
            try {
                await a.toPromise({timeout: 0});
            } catch (e) {
                err = e;
            }
            expect(err && err.message).to.equal('Event timed out.');
        });
        it('must reject on timeout, with name', async () => {
            const a = new SubEvent<number>();
            let err;
            try {
                await a.toPromise({name: 'first', timeout: 10});
            } catch (e) {
                err = e;
            }
            expect(err && err.message).to.equal('Event "first" timed out.');
        });/*
        it('must reject when cancelled', async () => {
            const a = new SubEvent<number>();
            let err;
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
        it('must reject when cancelled, with name', async () => {
            const a = new SubEvent();
            let err;
            try {
                setTimeout(() => {
                    a.cancelAll();
                }, 10);
                await a.toPromise({name: 'second', timeout: 1000});
            } catch (e) {
                err = e;
            }
            expect(err && err.message).to.equal('Event "second" cancelled.');
        });*/
        it('must invoke onCancel when cancelled manually', done => {
            const a = new SubEvent();
            let invoked = 0;
            const sub = a.subscribe(dummy, {
                onCancel: () => {
                    invoked++;
                    done();
                }
            });
            sub.cancel();
            sub.cancel();
            expect(invoked).to.equal(1);
        });

        it('must invoke onCancel when all cancelled', done => {
            const a = new SubEvent();
            let invoked = 0;
            a.subscribe(dummy, {
                onCancel: () => {
                    invoked++;
                    done();
                },
                name: 'all-cancel-event'
            });
            a.cancelAll();
            expect(invoked).to.equal(1);
        });

    });
});
