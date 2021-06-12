const debug = require('debug')('growi:models:userGroup');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');


/*
 * define schema
 */
const schema = new mongoose.Schema({
  userGroupId: String,
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
schema.plugin(mongoosePaginate);

class UserGroup {

  /**
   * public fields for UserGroup model
   *
   * @readonly
   * @static
   * @memberof UserGroup
   */
  static get USER_GROUP_PUBLIC_FIELDS() {
    return '_id name createdAt';
  }

  /**
   * limit items num for pagination
   *
   * @readonly
   * @static
   * @memberof UserGroup
   */
  static get PAGE_ITEMS() {
    return 10;
  }

  /*
   * model static methods
   */

  // グループ画像パスの生成
  static createUserGroupPictureFilePath(userGroup, name) {
    const ext = `.${name.match(/(.*)(?:\.([^.]+$))/)[2]}`;

    return `userGroup/${userGroup._id}${ext}`;
  }

  // すべてのグループを取得（オプション指定可）
  static findAllGroups(option) {
    return this.find().exec();
  }

  /**
   * find all entities with pagination
   *
   * @see https://github.com/edwardhotchkiss/mongoose-paginate
   *
   * @static
   * @param {any} opts mongoose-paginate options object
   * @returns {Promise<any>} mongoose-paginate result object
   * @memberof UserGroup
   */
  static findUserGroupsWithPagination(opts) {
    const query = {};
    const options = Object.assign({}, opts);
    if (options.page == null) {
      options.page = 1;
    }
    if (options.limit == null) {
      options.limit = UserGroup.PAGE_ITEMS;
    }

    return this.paginate(query, options)
      .catch((err) => {
        debug('Error on pagination:', err);
      });
  }

  // 登録可能グループ名確認
  static isRegisterableName(name) {
    const query = { name };

    return this.findOne(query)
      .then((userGroupData) => {
        return (userGroupData == null);
      });
  }

  // グループの完全削除
  static async removeCompletelyById(deleteGroupId, action, transferToUserGroupId, user) {
    const UserGroupRelation = mongoose.model('UserGroupRelation');

    const groupToDelete = await this.findById(deleteGroupId);
    if (groupToDelete == null) {
      throw new Error('UserGroup data is not exists. id:', deleteGroupId);
    }
    const deletedGroup = await groupToDelete.remove();

    await Promise.all([
      UserGroupRelation.removeAllByUserGroup(deletedGroup),
      UserGroup.crowi.pageService.handlePrivatePagesForDeletedGroup(deletedGroup, action, transferToUserGroupId, user),
    ]);

    return deletedGroup;
  }

  static countUserGroups() {
    return this.estimatedDocumentCount();
  }

  // グループ生成（名前が要る）
  static createGroupByName(name) {
    return this.create({ name });
  }

  // グループ名の更新
  async updateName(name) {
    // 名前を設定して更新
    this.name = name;
    await this.save();
  }

}


module.exports = function(crowi) {
  UserGroup.crowi = crowi;
  schema.loadClass(UserGroup);
  return mongoose.model('UserGroup', schema);
};
