import {dummy, expect} from './';
import {SubEvent} from '../src';

describe('Subscription', () => {
    it('must maintain the live status correctly', () => {
        const a = new SubEvent();
        const sub = a.subscribe(() => {
        });
        expect(sub.live).to.be.true;
        sub.cancel();
        expect(sub.live).to.be.false;
    });
    it('must do nothing on repeated cancel', () => {
        const a = new SubEvent();
        const sub = a.subscribe(() => {
        });
        const res1 = sub.cancel();
        const res2 = sub.cancel();
        expect(res1).to.be.true;
        expect(res2).to.be.false;
    });
    it('must invoke onCancel once when specified', done => {
        const a = new SubEvent();
        let invoked = 0;
        const sub = a.subscribe(dummy, {
            onCancel: () => {
                invoked++;
            }
        });
        sub.cancel();
        sub.cancel();
        setTimeout(() => {
            expect(invoked).to.equal(1);
            done();
        });
    });
});
