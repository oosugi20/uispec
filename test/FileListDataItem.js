const expect = require('chai').expect;
const sinon = require('sinon');

const FileListDataItem = require('../lib/FileListDataItem');

describe('FileListDataItem', () => {
  it('shoud be an constructor', () => {
    const item = new FileListDataItem({
      data: {}
    });
    expect(item).to.be.an.instanceof(FileListDataItem);
  });

  describe('#get()', () => {
    it('正しい値が返ること', () => {
      const testProp = 'test';
      const item = new FileListDataItem({
        data: { testProp }
      });
      expect(item.get('testProp')).to.equal(testProp);
    });
  });

  describe('#toData()', () => {
    it('objectが返ること', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.be.an('object');
    });

    describe('serveRelativePath', () => {
      it('serveRelativePathを持つこと', () => {
        const item = new FileListDataItem({
          data: {}
        });
        expect(item.toData()).to.have.property('serveRelativePath');
      });

      it('正しい相対パスが返ること', () => {
        const serveRootFullDir = '/porjects/project/public';
        const srcFullPath = '/porjects/project/public/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: {}
        });
        expect(item.toData().serveRelativePath).to.equal('hoge/fuga/var.html');
      });
    });

    it('depthを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('depth');
    });

    it('isIndexを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('isIndex');
    });

    it('titleを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('title');
    });

    it('urlを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('url');
    });

    it('summaryを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('summary');
    });

    it('updateを持つこと', () => {
      const item = new FileListDataItem({
        data: {}
      });
      expect(item.toData()).to.have.property('update');
    });
  });


  describe('#isIndex', () => {
    it('indexファイルならtrueを返すこと', () => {
      const srcFullPath = '/hoge/fuga/index.md';
      const item = new FileListDataItem({
        data: { srcFullPath }
      });
      expect(item.isIndex()).to.be.true;
    });
    it('indexファイルでなければfalseを返すこと', () => {
      const srcFullPath = '/hoge/fuga/var.md';
      const item = new FileListDataItem({
        data: { srcFullPath }
      });
      expect(item.isIndex()).to.be.false;
    });
  });
});
