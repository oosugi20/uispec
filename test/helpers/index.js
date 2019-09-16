const expect = require('chai').expect;
const sinon = require('sinon');

const helpers = require('../../lib/helpers');


describe('helpers', () => {
  it('isExistFileを持つこと', () => {
    expect(helpers).to.have.property('isExistFile');
  });

  it('splitUpMarkdownStringを持つこと', () => {
    expect(helpers).to.have.property('splitUpMarkdownString');
  });

  it('readMarkdownFileを持つこと', () => {
    expect(helpers).to.have.property('readMarkdownFile');
  });
});
