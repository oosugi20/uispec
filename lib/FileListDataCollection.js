const _ = require('lodash');

const FileListDataItem = require('./FileListDataItem');

class FileListDataCollection {
  constructor(itemsData) {
    this.items = _.map(itemsData, (itemData) => {
      return new FileListDataItem({
        data: itemData,
        collection: this,
      });
    });
  }

  sort() {
    this.items.sort((a, b) => {
      const regIndex = /index\.md/;

      if (a.get('srcFullDir') < b.get('srcFullDir')) {
        return -1;
      } else if (a.get('srcFullDir') > b.get('srcFullDir')) {
        return 1;
      }

      // 同じディレクトリ
      //
      // indexを先に
      if (regIndex.test(a.get('srcFileName'))) {
        return -1;
      } else if (regIndex.test(b.get('srcFileName'))) {
        return 1;
      }

      // index以外
      if (a.get('srcFileName') < b.get('srcFileName')) {
        return -1;
      } else if (a.get('srcFileName') > b.get('srcFileName')) {
        return 1;
      }

      return 0;
    });
  }

  toData() {
    return {
      items: _.map(this.items, item => item.toData()),
    };
  }
}


module.exports = FileListDataCollection;
