import {expect, chai} from './';
import {ISubContext, SubEvent} from '../src';

const dummy = () => {
};

describe('SubEvent', () => {
    it('must initialize correctly', () => {
        const a = new SubEvent();
        expect(a.count).to.eq(0);
        expect(a.maxSubs).to.eq(0);
    });
    it('must invoke subscription functions', () => {
        const a = new SubEvent<number>();
        const cb = () => 1;
        const s = chai.spy(cb);
        a.subscribe(s);
        a.emit(123, {
            onFinished: (count: number) => {
                expect(count).to.be.eq(1);
                expect(s).to.have.been.called.with(123);
            }
        });
    });
    it('must cease async notifications when cancelled', done => {
        const a = new SubEvent<number>();
        const values: number[] = [];
        const sub = a.subscribe((value: number) => {
            values.push(value);
            sub.cancel();
        });
        a.emit(1);
        a.emit(2);
        a.emit(3);
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
    describe('emitSafe', () => {
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
            a.emit(123, {onError});
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
    describe('emitSyncSafe', () => {
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
            b.emit(123, {onError});
            setTimeout(() => {
                expect(onError).to.have.been.called.with(err);
                done();
            }, 10);
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
});
