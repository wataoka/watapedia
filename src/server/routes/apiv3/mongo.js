const loggerFactory = require('@alias/logger');

const logger = loggerFactory('growi:routes:apiv3:mongo'); // eslint-disable-line no-unused-vars

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @swagger
 *  tags:
 *    name: Mongo
 */

module.exports = (crowi) => {
  const loginRequiredStrictly = require('../../middlewares/login-required')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);

  /**
   * @swagger
   *
   *  /mongo/collections:
   *    get:
   *      tags: [Mongo]
   *      operationId: getMongoCollections
   *      summary: /mongo/collections
   *      description: get mongodb collections names
   *      responses:
   *        200:
   *          description: a list of collections in mongoDB
   *          content:
   *            application/json:
   *              schema:
   *                properties:
   *                  collections:
   *                    type: array
   *                    items:
   *                      type: string
   */
  router.get('/collections', loginRequiredStrictly, adminRequired, async(req, res) => {
    const listCollectionsResult = await mongoose.connection.db.listCollections().toArray();
    const collections = listCollectionsResult.map(collectionObj => collectionObj.name);

    // TODO: use res.apiv3
    return res.json({
      ok: true,
      collections,
    });
  });

  return router;
};
