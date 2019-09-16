const expect = require('chai').expect;
const sinon = require('sinon');

const FileListDataCollection = require('../lib/FileListDataCollection');

describe('FileListDataCollection', () => {
  it('shoud be an constructor', () => {
    const collection = new FileListDataCollection();
    expect(collection).to.be.an.instanceof(FileListDataCollection);
  });

  describe('#toData()', () => {
    it('objectが返ること', () => {
      const collection = new FileListDataCollection();
      expect(collection.toData()).to.be.an('object');
    });

    it('itemsを持つこと', () => {
      const collection = new FileListDataCollection();
      expect(collection.toData()).to.have.property('items');
    });

    describe('items', () => {
      it('todo');
    });
  });
});
