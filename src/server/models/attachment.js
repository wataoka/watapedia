// disable no-return-await for model functions
/* eslint-disable no-return-await */

// eslint-disable-next-line no-unused-vars
const logger = require('@alias/logger')('growi:models:attachment');
const path = require('path');

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const mongoosePaginate = require('mongoose-paginate-v2');
const { addSeconds } = require('date-fns');

const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = function(crowi) {
  function generateFileHash(fileName) {
    const hash = require('crypto').createHash('md5');
    hash.update(`${fileName}_${Date.now()}`);

    return hash.digest('hex');
  }

  const attachmentSchema = new mongoose.Schema({
    page: { type: ObjectId, ref: 'Page', index: true },
    creator: { type: ObjectId, ref: 'User', index: true },
    filePath: { type: String }, // DEPRECATED: remains for backward compatibility for v3.3.x or below
    fileName: { type: String, required: true, unique: true },
    originalName: { type: String },
    fileFormat: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    temporaryUrlCached: { type: String },
    temporaryUrlExpiredAt: { type: Date },
  });
  attachmentSchema.plugin(uniqueValidator);
  attachmentSchema.plugin(mongoosePaginate);

  attachmentSchema.virtual('filePathProxied').get(function() {
    return `/attachment/${this._id}`;
  });

  attachmentSchema.virtual('downloadPathProxied').get(function() {
    return `/download/${this._id}`;
  });

  attachmentSchema.set('toObject', { virtuals: true });
  attachmentSchema.set('toJSON', { virtuals: true });


  attachmentSchema.statics.createWithoutSave = function(pageId, user, fileStream, originalName, fileFormat, fileSize) {
    const Attachment = this;

    const extname = path.extname(originalName);
    let fileName = generateFileHash(originalName);
    if (extname.length > 1) { // ignore if empty or '.' only
      fileName = `${fileName}${extname}`;
    }

    const attachment = new Attachment();
    attachment.page = pageId;
    attachment.creator = user._id;
    attachment.originalName = originalName;
    attachment.fileName = fileName;
    attachment.fileFormat = fileFormat;
    attachment.fileSize = fileSize;
    attachment.createdAt = Date.now();

    return attachment;
  };


  attachmentSchema.methods.getValidTemporaryUrl = function() {
    if (this.temporaryUrlExpiredAt == null) {
      return null;
    }
    // return null when expired url
    if (this.temporaryUrlExpiredAt.getTime() < new Date().getTime()) {
      return null;
    }
    return this.temporaryUrlCached;
  };

  attachmentSchema.methods.cashTemporaryUrlByProvideSec = function(temporaryUrl, provideSec) {
    if (temporaryUrl == null) {
      throw new Error('url is required.');
    }
    this.temporaryUrlCached = temporaryUrl;
    this.temporaryUrlExpiredAt = addSeconds(new Date(), provideSec);

    return this.save();
  };

  return mongoose.model('Attachment', attachmentSchema);
};
