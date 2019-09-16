const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache();

const fs = require('fs');
const path = require('path');

const testTitle = 'test title';
const testMeta = `---
title: ${testTitle}
---`;

const testBody = `# test h1
## test h2
hoge hoge hoge`;

const testString = `${testMeta}
${testBody}`;

const testFileName = '__testFileForReadMarkdownFile';
const testFilePath = path.join(__dirname, testFileName);


const stubSplitUpMarkdownString = sinon.stub();
stubSplitUpMarkdownString.returns({
  title: testTitle,
  body: testBody,
});

const readMarkdownFile = proxyquire('../../lib/helpers/readMarkdownFile', {
  './splitUpMarkdownString': stubSplitUpMarkdownString,
});

describe('readMarkdownFile', () => {
  it('shoud be function', () => {
    expect(readMarkdownFile).to.be.a('function');
  });

  it('正しいデータが返ること', () => {
    fs.writeFileSync(testFilePath, testString);
    const data = readMarkdownFile(testFilePath);
    expect(data.title).to.equal(testTitle);
    expect(data.screen).to.equal('');
    expect(data.url).to.equal('');
    expect(data.summary).to.equal('');
    expect(data.update).to.equal('');
    expect(data.body).to.equal(testBody);
    fs.unlinkSync(testFilePath);
  });

  it('srcFullPathが返ること', () => {
    fs.writeFileSync(testFilePath, testString);
    const data = readMarkdownFile(testFilePath);
    expect(data.srcFullPath).to.equal(testFilePath);
    fs.unlinkSync(testFilePath);
  });

  it('srcFullDirが返ること', () => {
    fs.writeFileSync(testFilePath, testString);
    const data = readMarkdownFile(testFilePath);
    expect(data.srcFullDir).to.equal(__dirname);
    fs.unlinkSync(testFilePath);
  });

  it('srcFileNameが返ること', () => {
    fs.writeFileSync(testFilePath, testString);
    const data = readMarkdownFile(testFilePath);
    expect(data.srcFileName).to.equal(testFileName);
    fs.unlinkSync(testFilePath);
  });
});
