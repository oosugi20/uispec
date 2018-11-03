const expect = require('chai').expect;
const sinon = require('sinon');

const isExistFile = require('../../lib/helpers/isExistFile');

const fs = require('fs');
const path = require('path');

describe('isExistFile', () => {
  const testFilePath = path.join(__dirname, '__testFileForIsExistFile');

  it('shoud be function', () => {
    expect(isExistFile).to.be.a('function');
  });

  it('渡したファイルパスのファイルが存在するならtrueを返すこと', () => {
    fs.writeFileSync(testFilePath, '');
    expect(isExistFile(testFilePath)).to.be.true;
    fs.unlinkSync(testFilePath);
  });

  it('渡したファイルパスのファイルが存在しないならfalseを返すこと', () => {
    expect(isExistFile(testFilePath)).to.be.false;
  });
});
