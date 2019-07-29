import {expect, chai} from './';
import {SubEvent} from '../src';

describe('SubEvent', () => {
    it('must invoke subscription functions', () => {
        const a = new SubEvent<number>();
        const cb = () => 1;
        const s = chai.spy(cb);
        a.subscribe(s);
        a.emit(123, (count: number) => {
            expect(count).to.be.equal(1);
            expect(s).to.have.been.called.with(123);
        });
    });
    it('must track subscription count', () => {
        const a = new SubEvent();
        expect(a.count).to.equal(0);
        const sub1 = a.subscribe(() => 1);
        expect(a.count).to.equal(1);
        const sub2 = a.subscribe(() => 2);
        expect(a.count).to.equal(2);
        sub1.cancel();
        expect(a.count).to.equal(1);
        sub2.cancel();
        expect(a.count).to.equal(0);
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
        expect(a.count).to.equal(2);
        a.emit(123, (count: number) => {
            expect(count).to.be.equal(1);
            expect(s1).to.have.been.called.with(123);
            expect(s2).to.not.have.been.called;
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
    });
});
