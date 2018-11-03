const expect = require('chai').expect;
const sinon = require('sinon');

const helpers = require('../../lib/helpers');


describe('helpers', () => {
  it('isExistFileを持つこと', () => {
    const isExistFile = require('../../lib/helpers/isExistFile');
    expect(helpers.isExistFile).to.equal(isExistFile);
  });
});
