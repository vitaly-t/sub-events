import {dummy, expect} from './';
import {EventConsumer, SubEvent, Subscription} from '../src';

describe('EventConsumer', () => {
    const e = new SubEvent<number>({maxSubs: 10});
    const c = new EventConsumer<number>(e);
    it('can initialize', () => {
        expect(c).to.be.instanceOf(EventConsumer);
    });
    it('must forward methods correctly', () => {
        expect(c.count).to.equal(e.count);
        expect(c.maxSubs).to.equal(e.maxSubs);
        expect(c.subscribe(dummy)).to.be.instanceOf(Subscription);
        expect(c.once(dummy)).to.be.instanceOf(Subscription);
        expect(c.toPromise()).to.be.instanceOf(Promise);
        expect(c.getStat()).to.eql({named: {}, unnamed: 3});
    });
    it('must not have hidden methods', () => {
        expect((c as any).emit).to.be.undefined;
        expect((c as any).cancelAll).to.be.undefined;
    });
});
