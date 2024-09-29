import * as ch from 'chai';
import spies from 'chai-spies';
import {describe} from 'mocha';

const chai = ch.use(spies);

const expect = ch.expect;
const should = ch.should();

const dummy = () => {
};

export {describe, expect, should, chai, dummy};
