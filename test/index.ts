import chai from 'chai';
import spies from 'chai-spies';
import {describe} from 'mocha';

chai.use(spies);

const expect = chai.expect;
const should = chai.should();

export {describe, expect, should, chai};
