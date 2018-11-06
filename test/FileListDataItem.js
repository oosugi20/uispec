const expect = require('chai').expect;
const sinon = require('sinon');

const FileListDataItem = require('../lib/FileListDataItem');

describe('FileListDataItem', () => {
  it('shoud be an constructor', () => {
    const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
    const item = new FileListDataItem({
      data: { srcFullPath },
      collection: {
        srcRootFullDir: '/projects/project/src',
        serveDir: '/_uispec',
      }
    });
    expect(item).to.be.an.instanceof(FileListDataItem);
  });

  describe('#get()', () => {
    it('正しい値が返ること', () => {
      const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const testProp = 'test';
      const item = new FileListDataItem({
        data: { srcFullPath, testProp },
        collection: {
          srcRootFullDir: '/projects/project/src',
          serveDir: '/_uispec',
        }
      });
      expect(item.get('testProp')).to.equal(testProp);
    });
  });

  describe('#toData()', () => {
    it('objectが返ること', () => {
      const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
        data: { srcFullPath },
        collection: {
          srcRootFullDir: '/projects/project/src',
          serveDir: '/_uispec',
        }
      });
      expect(item.toData()).to.be.an('object');
    });

    describe('serveRelativePath', () => {
      it('serveRelativePathを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData()).to.have.property('serveRelativePath');
      });

      it('正しい相対パスが返ること', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData().serveRelativePath).to.equal('hoge/fuga/var.html');
      });
    });

    describe('depth', () => {
      it('depthを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData()).to.have.property('depth');
      });

      it('正しい数値が返ること(/index.md)', () => {
        const srcFullPath = '/projects/project/src/index.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData().depth).to.equal(0);
      });

      it('正しい数値が返ること(/hoge/index.md)', () => {
        const srcFullPath = '/projects/project/src/hoge/index.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData().depth).to.equal(1);
      });

      it('正しい数値が返ること(/hoge/fuga/var.md)', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.toData().depth).to.equal(3);
      });
    });

    it('isIndexを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
      });
      expect(item.toData()).to.have.property('isIndex');
    });

    it('titleを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
      });
      expect(item.toData()).to.have.property('title');
    });

    it('urlを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
      });
      expect(item.toData()).to.have.property('url');
    });

    it('summaryを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
      });
      expect(item.toData()).to.have.property('summary');
    });

    it('updateを持つこと', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
      });
      expect(item.toData()).to.have.property('update');
    });
  });


  describe('#isIndex', () => {
    it('indexファイルならtrueを返すこと', () => {
      const srcFullPath = '/projects/project/src/hoge/fuga/index.md';
      const item = new FileListDataItem({
        data: { srcFullPath },
        collection: {
          srcRootFullDir: '/projects/project/src',
          serveDir: '/_uispec',
        }
      });
      expect(item.isIndex()).to.be.true;
    });
    it('indexファイルでなければfalseを返すこと', () => {
      const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
      const item = new FileListDataItem({
        data: { srcFullPath },
        collection: {
          srcRootFullDir: '/projects/project/src',
          serveDir: '/_uispec',
        }
      });
      expect(item.isIndex()).to.be.false;
    });
  });


  describe('props', () => {
    describe('servePath', () => {
      it('正しいパスが返ること', () => {
        const srcFullPath = '/projects/project/src/hoge/fuga/var.md';
        const item = new FileListDataItem({
          data: { srcFullPath },
          collection: {
            srcRootFullDir: '/projects/project/src',
            serveDir: '/_uispec',
          }
        });
        expect(item.get('servePath')).to.equal('/_uispec/hoge/fuga/var.html');
      });
    });
  });
});
