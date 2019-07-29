import {expect, chai} from './';
import {Observable} from '../src';

describe('Observable', () => {
    it('must invoke subscription functions', () => {
        const a = new Observable<number>();
        const cb = () => 1;
        const s = chai.spy(cb);
        a.subscribe(s);
        a.next(123, (count: number) => {
            expect(count).to.be.equal(1);
            expect(s).to.have.been.called.with(123);
        });
    });
    it('must track subscription count', () => {
        const a = new Observable();
        expect(a.count).to.equal(0);
        const sub1 = a.subscribe(() => 1);
        expect(a.count).to.equal(1);
        const sub2 = a.subscribe(() => 2);
        expect(a.count).to.equal(2);
        sub1.unsubscribe();
        expect(a.count).to.equal(1);
        sub2.unsubscribe();
        expect(a.count).to.equal(0);
    });
    it('must track subscription live status', () => {
        const a = new Observable();
        const sub = a.subscribe(() => 1);
        expect(sub.live).to.be.true;
        sub.unsubscribe();
        expect(sub.live).to.be.false;
    });

    it('must limit notifications according to the max option', () => {
        const a = new Observable<number>({max: 1});
        const cb1 = () => 1;
        const cb2 = () => 2;
        const s1 = chai.spy(cb1);
        const s2 = chai.spy(cb2);
        a.subscribe(s1);
        a.subscribe(s2);
        expect(a.count).to.equal(2);
        a.next(123, (count: number) => {
            expect(count).to.be.equal(1);
            expect(s1).to.have.been.called.with(123);
            expect(s2).to.not.have.been.called;
        });
    });
    describe('nextSafe', () => {
        const err = new Error('Ops!');
        it('must handle errors from synchronous subscribers', done => {
            const a = new Observable();
            a.subscribe(() => {
                throw err;
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            a.nextSafe(123, s);
            setTimeout(() => {
                expect(s).to.have.been.called.with(err);
                done();
            });
        });
        it('must handle errors from asynchronous subscribers', done => {
            const a = new Observable();
            a.subscribe(async () => {
                throw err;
            });
            const handler = () => 1;
            const s = chai.spy(handler);
            a.nextSafe(123, s);
            setTimeout(() => {
                expect(s).to.have.been.called.with(err);
                done();
            });
        });
    });
    describe('unsubscribeAll', () => {
        it('must cancel all current subscriptions', () => {
            const received: string[] = [];
            const a = new Observable<string>();
            const sub = a.subscribe(value => {
                received.push(value);
            });
            a.nextSync('first');
            a.unsubscribeAll();
            a.nextSync('second');
            expect(received).to.eql(['first']);
            expect(sub.live).to.be.false;
        });
    });
});
