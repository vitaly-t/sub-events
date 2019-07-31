import {expect, chai} from './';
import {ISubContext, SubEvent} from '../src';

const dummy = () => {
};

describe('SubEvent', () => {
    it('must invoke subscription functions', () => {
        const a = new SubEvent<number>();
        const cb = () => 1;
        const s = chai.spy(cb);
        a.subscribe(s);
        a.emit(123, (count: number) => {
            expect(count).to.be.eq(1);
            expect(s).to.have.been.called.with(123);
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
    it('must limit notifications according to the max option', () => {
        const a = new SubEvent<number>({max: 1});
        const cb1 = () => 1;
        const cb2 = () => 2;
        const s1 = chai.spy(cb1);
        const s2 = chai.spy(cb2);
        a.subscribe(s1);
        a.subscribe(s2);
        expect(a.count).to.eq(2);
        a.emit(123, (count: number) => {
            expect(count).to.be.eq(1);
            expect(s1).to.have.been.called.with(123);
            expect(s2).to.not.have.been.called;
        });
    });
    it('must call onSubscribe during subscription', () => {
        let called = false;
        const onSubscribe = (ctx: ISubContext) => {
            called = true;
        };
        const a = new SubEvent({onSubscribe});
        expect(called).to.be.false;
        a.subscribe(dummy);
        expect(called).to.be.true;
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
        const sub = a.subscribe(dummy);
        expect(called).to.be.false;
        sub.cancel();
        expect(called).to.be.true;
        expect(data).to.eq(123);
    });
    it('must call onFinish when done', done => {
        let count: number;
        const a = new SubEvent<string>();
        const sub1 = a.subscribe(dummy);
        const sub2 = a.subscribe(dummy);
        const onFinished = (c: number) => {
            count = c;
        };
        const handler = chai.spy(onFinished);
        a.emit('hello', handler);
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
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            a.emitSafe(123, s);
            setTimeout(() => {
                expect(s).to.have.been.called.with(err);
                done();
            });
        });
        it('must handle errors from asynchronous subscribers', done => {
            const a = new SubEvent();
            a.subscribe(async () => {
                throw err;
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            a.emitSafe(123, s);
            setTimeout(() => {
                expect(s).to.have.been.called.with(err);
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
            a.emitSafe(123, dummy, handler);
            setTimeout(() => {
                expect(handler).to.have.been.called.once;
                expect(count).to.eq(1);
                done();
            });
        });

    });
    describe('emitSyncSafe', () => {
        const err = new Error('Ops!');
        it('must handle errors from synchronous subscribers', () => {
            const a = new SubEvent();
            a.subscribe(() => {
                throw err;
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            a.emitSyncSafe(123, s);
            expect(s).to.have.been.called.with(err);
        });
        it('must handle errors from asynchronous subscribers', done => {
            const b = new SubEvent();
            b.subscribe(async () => {
                return Promise.reject(err);
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            b.emitSyncSafe(123, s);
            setTimeout(() => {
                expect(s).to.have.been.called.with(err);
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
            a.emitSync('first');
            a.cancelAll();
            a.emitSync('second');
            expect(received).to.eql(['first']);
            expect(sub.live).to.be.false;
        });
        it('must invoke onCancel for each subscription', () => {
            let data;
            const onSubscribe = (ctx: ISubContext<string, number>) => {
                ctx.data = 123;
            };
            const onCancel = (ctx: ISubContext<string, number>) => {
                data = ctx.data;
            };
            const a = new SubEvent<string>({onSubscribe, onCancel});
            a.subscribe(dummy);
            expect(data).to.be.undefined;
            a.cancelAll();
            expect(data).to.eq(123);
        });
    });
});
