const expect = require('chai').expect;
const sinon = require('sinon');

const splitUpMarkdownString = require('../../lib/helpers/splitUpMarkdownString');

const testTitle = 'test title';
const testMeta = `---
title: ${testTitle}
---`;

const testBody = `# test h1
## test h2
hoge hoge hoge`;

const testString = `${testMeta}
${testBody}`;

describe('splitUpMarkdownString', () => {
  it('meta情報とbodyを持つobjectを返すこと', () => {
    const splited = splitUpMarkdownString(testString);
    expect(splited).to.be.an('object');
    expect(splited).to.have.property('title');
    expect(splited).to.have.property('body');
  });

  describe('meta', () => {
    it('与えたソースと等しいデータが返ること', () => {
      const splited = splitUpMarkdownString(testString);
      expect(splited.title).to.equal(testTitle);
    });
  });

  describe('body', () => {
    it('与えたソースと等しいデータが返ること', () => {
      const splited = splitUpMarkdownString(testString);
      expect(splited.body).to.equal(testBody);
    });
  });
});
