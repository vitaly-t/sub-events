import {chai, expect} from './';
import {EmitSchedule, ISubCountChange, SubEventCount} from '../src';

const dummy = () => {
};

describe('SubEventCount', () => {
    it('must notify about the count', () => {
        const a = new SubEventCount<string>();
        const cb = (data: ISubCountChange) => {
        };
        const s = chai.spy(cb);
        a.onCount.subscribe(s);
        a.subscribe(() => {
        });
        expect(s).to.have.been.called.with({newCount: 1, prevCount: 0});
        expect(s).to.have.been.called.once;
    });
    describe('cancel', () => {
        it('must cease notifications after cancellation', () => {
            const a = new SubEventCount<string>();
            const data: string[] = [];
            const sub = a.subscribe(msg => {
                data.push(msg);
            });
            a.emit('one');
            sub.cancel();
            a.emit('two');
            expect(data).to.eql(['one']);
        });
    });
    describe('cancelAll', () => {
        it('must notify about zero clients', () => {
            const received: ISubCountChange[] = [];
            const a = new SubEventCount<string>();
            a.onCount.subscribe((data: ISubCountChange) => {
                received.push(data);
            });
            const sub1 = a.subscribe(() => 123);
            const sub2 = a.subscribe(() => 456);
            expect(sub1.live).to.be.true;
            expect(sub2.live).to.be.true;
            a.cancelAll();
            expect(sub1.live).to.be.false;
            expect(sub2.live).to.be.false;
            expect(received).to.eql([
                {newCount: 1, prevCount: 0},
                {newCount: 2, prevCount: 1},
                {newCount: 0, prevCount: 2}
            ]);
        });
        it('must do nothing when there are no clients', () => {
            const a = new SubEventCount<string>();
            expect(a.cancelAll()).to.eq(0);
        });
        it('must not allow emits from counts of cancelled subs', () => {
            const received: any[] = [];
            const a = new SubEventCount<string>();
            a.onCount.subscribe((data: ISubCountChange) => {
                received.push(data);
                a.emit('hello');
            });
            a.subscribe(data => {
                received.push(data);
            });
            a.cancelAll();
            expect(received).to.eql([{prevCount: 0, newCount: 1}, 'hello', {prevCount: 1, newCount: 0}]);
        });
    });
    describe('with options', () => {
        it('must allow empty options', () => {
            let res: ISubCountChange | null = null;
            const a = new SubEventCount<string>({});
            a.onCount.subscribe(data => {
                res = data;
            });
            a.subscribe(dummy);
            expect(res).to.eql({prevCount: 0, newCount: 1});
        });
        it('must support async notifications', done => {
            let res: ISubCountChange | null = null;
            const a = new SubEventCount<string>({emitOptions: {schedule: EmitSchedule.async}});
            a.onCount.subscribe(data => {
                res = data;
            });
            a.subscribe(dummy);
            expect(res).to.be.null;
            setTimeout(() => {
                expect(res).to.eql({prevCount: 0, newCount: 1});
                done();
            });
        });
    });
});
