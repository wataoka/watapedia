const logger = require('@alias/logger')('growi:services:ExportService'); // eslint-disable-line no-unused-vars

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Transform } = require('stream');
const streamToPromise = require('stream-to-promise');
const archiver = require('archiver');
const ConfigLoader = require('../service/config-loader');

const toArrayIfNot = require('../../lib/util/toArrayIfNot');

const CollectionProgressingStatus = require('../models/vo/collection-progressing-status');

class ExportProgressingStatus extends CollectionProgressingStatus {

  async init() {
    // retrieve total document count from each collections
    const promises = this.progressList.map(async(collectionProgress) => {
      const collection = mongoose.connection.collection(collectionProgress.collectionName);
      collectionProgress.totalCount = await collection.count();
    });
    await Promise.all(promises);

    this.recalculateTotalCount();
  }

}

class ExportService {

  constructor(crowi) {
    this.crowi = crowi;
    this.appService = crowi.appService;
    this.growiBridgeService = crowi.growiBridgeService;
    this.getFile = this.growiBridgeService.getFile.bind(this);
    this.baseDir = path.join(crowi.tmpDir, 'downloads');
    this.per = 100;
    this.zlibLevel = 9; // 0(min) - 9(max)

    this.adminEvent = crowi.event('admin');

    this.currentProgressingStatus = null;
  }

  /**
   * parse all zip files in downloads dir
   *
   * @memberOf ExportService
   * @return {object} info for zip files and whether currentProgressingStatus exists
   */
  async getStatus() {
    const zipFiles = fs.readdirSync(this.baseDir).filter(file => path.extname(file) === '.zip');

    // process serially so as not to waste memory
    const zipFileStats = [];
    const parseZipFilePromises = zipFiles.map((file) => {
      const zipFile = this.getFile(file);
      return this.growiBridgeService.parseZipFile(zipFile);
    });
    for await (const stat of parseZipFilePromises) {
      zipFileStats.push(stat);
    }

    // filter null object (broken zip)
    const filtered = zipFileStats.filter(element => element != null);

    const isExporting = this.currentProgressingStatus != null;

    return {
      zipFileStats: filtered,
      isExporting,
      progressList: isExporting ? this.currentProgressingStatus.progressList : null,
    };
  }

  /**
   * create meta.json
   *
   * @memberOf ExportService
   * @return {string} path to meta.json
   */
  async createMetaJson() {
    const metaJson = path.join(this.baseDir, this.growiBridgeService.getMetaFileName());
    const writeStream = fs.createWriteStream(metaJson, { encoding: this.growiBridgeService.getEncoding() });
    const passwordSeed = this.crowi.env.PASSWORD_SEED || null;

    const metaData = {
      version: this.crowi.version,
      url: this.appService.getSiteUrl(),
      passwordSeed,
      exportedAt: new Date(),
      envVars: ConfigLoader.getEnvVarsForDisplay(),
    };

    writeStream.write(JSON.stringify(metaData));
    writeStream.close();

    await streamToPromise(writeStream);

    return metaJson;
  }

  /**
   *
   * @param {ExportProgress} exportProgress
   * @return {Transform}
   */
  generateLogStream(exportProgress) {
    const logProgress = this.logProgress.bind(this);

    let count = 0;

    return new Transform({
      transform(chunk, encoding, callback) {
        count++;
        logProgress(exportProgress, count);

        this.push(chunk);

        callback();
      },
    });
  }

  /**
   * insert beginning/ending brackets and comma separator for Json Array
   *
   * @memberOf ExportService
   * @return {TransformStream}
   */
  generateTransformStream() {
    let isFirst = true;

    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        // write beginning brace
        if (isFirst) {
          this.push('[');
          isFirst = false;
        }
        // write separator
        else {
          this.push(',');
        }

        this.push(chunk);
        callback();
      },
      final(callback) {
        // write beginning brace
        if (isFirst) {
          this.push('[');
        }
        // write ending brace
        this.push(']');
        callback();
      },
    });

    return transformStream;
  }

  /**
   * dump a mongodb collection into json
   *
   * @memberOf ExportService
   * @param {string} collectionName collection name
   * @return {string} path to zip file
   */
  async exportCollectionToJson(collectionName) {
    const collection = mongoose.connection.collection(collectionName);

    const nativeCursor = collection.find();
    const readStream = nativeCursor.stream({ transform: JSON.stringify });

    // get TransformStream
    const transformStream = this.generateTransformStream();

    // log configuration
    const exportProgress = this.currentProgressingStatus.progressMap[collectionName];
    const logStream = this.generateLogStream(exportProgress);

    // create WritableStream
    const jsonFileToWrite = path.join(this.baseDir, `${collectionName}.json`);
    const writeStream = fs.createWriteStream(jsonFileToWrite, { encoding: this.growiBridgeService.getEncoding() });

    readStream
      .pipe(logStream)
      .pipe(transformStream)
      .pipe(writeStream);

    await streamToPromise(writeStream);

    return writeStream.path;
  }

  /**
   * export multiple Collections into json and Zip
   *
   * @memberOf ExportService
   * @param {Array.<string>} collections array of collection name
   * @return {Array.<string>} paths to json files created
   */
  async exportCollectionsToZippedJson(collections) {
    const metaJson = await this.createMetaJson();

    // process serially so as not to waste memory
    const jsonFiles = [];
    const jsonFilesPromises = collections.map(collectionName => this.exportCollectionToJson(collectionName));
    for await (const jsonFile of jsonFilesPromises) {
      jsonFiles.push(jsonFile);
    }

    // send terminate event
    this.emitStartZippingEvent();

    // zip json
    const configs = jsonFiles.map((jsonFile) => { return { from: jsonFile, as: path.basename(jsonFile) } });
    // add meta.json in zip
    configs.push({ from: metaJson, as: path.basename(metaJson) });
    // exec zip
    const zipFile = await this.zipFiles(configs);

    // get stats for the zip file
    const addedZipFileStat = await this.growiBridgeService.parseZipFile(zipFile);

    // send terminate event
    this.emitTerminateEvent(addedZipFileStat);

    // TODO: remove broken zip file
  }

  async export(collections) {
    if (this.currentProgressingStatus != null) {
      throw new Error('There is an exporting process running.');
    }

    this.currentProgressingStatus = new ExportProgressingStatus(collections);
    await this.currentProgressingStatus.init();

    try {
      await this.exportCollectionsToZippedJson(collections);
    }
    finally {
      this.currentProgressingStatus = null;
    }

  }

  /**
   * log export progress
   *
   * @memberOf ExportService
   *
   * @param {CollectionProgress} collectionProgress
   * @param {number} currentCount number of items exported
   */
  logProgress(collectionProgress, currentCount) {
    const output = `${collectionProgress.collectionName}: ${currentCount}/${collectionProgress.totalCount} written`;

    // update exportProgress.currentCount
    collectionProgress.currentCount = currentCount;

    // output every this.per items
    if (currentCount % this.per === 0) {
      logger.debug(output);
      this.emitProgressEvent();
    }
    // output last item
    else if (currentCount === collectionProgress.totalCount) {
      logger.info(output);
      this.emitProgressEvent();
    }
  }

  /**
   * emit progress event
   */
  emitProgressEvent() {
    const { currentCount, totalCount, progressList } = this.currentProgressingStatus;
    const data = {
      currentCount,
      totalCount,
      progressList,
    };

    // send event (in progress in global)
    this.adminEvent.emit('onProgressForExport', data);
  }

  /**
   * emit start zipping event
   */
  emitStartZippingEvent() {
    this.adminEvent.emit('onStartZippingForExport', {});
  }

  /**
   * emit terminate event
   * @param {object} zipFileStat added zip file status data
   */
  emitTerminateEvent(zipFileStat) {
    this.adminEvent.emit('onTerminateForExport', { addedZipFileStat: zipFileStat });
  }

  /**
   * zip files into one zip file
   *
   * @memberOf ExportService
   * @param {object|array<object>} configs object or array of object { from: "path to source file", as: "file name after unzipped" }
   * @return {string} absolute path to the zip file
   * @see https://www.archiverjs.com/#quick-start
   */
  async zipFiles(_configs) {
    const configs = toArrayIfNot(_configs);
    const appTitle = this.appService.getAppTitle();
    const timeStamp = (new Date()).getTime();
    const zipFile = path.join(this.baseDir, `${appTitle}-${timeStamp}.growi.zip`);
    const archive = archiver('zip', {
      zlib: { level: this.zlibLevel },
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') logger.error(err);
      else throw err;
    });

    // good practice to catch this error explicitly
    archive.on('error', (err) => { throw err });

    for (const { from, as } of configs) {
      const input = fs.createReadStream(from);

      // append a file from stream
      archive.append(input, { name: as });
    }

    const output = fs.createWriteStream(zipFile);

    // pipe archive data to the file
    archive.pipe(output);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();

    await streamToPromise(archive);

    logger.info(`zipped growi data into ${zipFile} (${archive.pointer()} bytes)`);

    // delete json files
    for (const { from } of configs) {
      fs.unlinkSync(from);
    }

    return zipFile;
  }

  getReadStreamFromRevision(revision, format) {
    const data = revision.body;

    const Readable = require('stream').Readable;
    const readable = new Readable();
    readable._read = () => {};
    readable.push(data);
    readable.push(null);

    return readable;
  }

}

module.exports = ExportService;
