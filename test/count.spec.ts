import {expect, chai} from './';
import {SubCount, ICountChange} from '../src';

describe('SubCount', () => {
    it('must notify about the count', () => {
        const a = new SubCount<string>({sync: true});
        const cb = (data: ICountChange) => {
        };
        const s = chai.spy(cb);
        a.onCount.subscribe(s);
        a.subscribe(() => {
        });
        expect(s).to.have.been.called.with({newCount: 1, prevCount: 0});
        expect(s).to.have.been.called.once;
    });
    describe('cancelAll', () => {
        it('must notify about zero clients', () => {
            const received: ICountChange[] = [];
            const a = new SubCount<string>({sync: true});
            a.onCount.subscribe((data: ICountChange) => {
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
    });
});
