const loggerFactory = require('@alias/logger');

const logger = loggerFactory('growi:routes:apiv3:user-group-relation'); // eslint-disable-line no-unused-vars

const express = require('express');

const ErrorV3 = require('../../models/vo/error-apiv3');
const { serializeUserGroupRelationSecurely } = require('../../models/serializers/user-group-relation-serializer');

const router = express.Router();

/**
 * @swagger
 *  tags:
 *    name: UserGroupRelation
 */

module.exports = (crowi) => {
  const loginRequiredStrictly = require('../../middlewares/login-required')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);

  const { UserGroupRelation } = crowi.models;

  /**
   * @swagger
   *  paths:
   *    /user-group-relations:
   *      get:
   *        tags: [UserGroupRelation]
   *        operationId: listUserGroupRelations
   *        summary: /user-group-relations
   *        description: Gets the user group relations
   *        responses:
   *          200:
   *            description: user group relations are fetched
   *            content:
   *              application/json:
   *                schema:
   *                  properties:
   *                    userGroupRelations:
   *                      type: object
   *                      description: contains arrays user objects related
   */
  router.get('/', loginRequiredStrictly, adminRequired, async(req, res) => {
    try {
      const relations = await UserGroupRelation.find().populate('relatedUser');

      const serialized = relations.map(relation => serializeUserGroupRelationSecurely(relation));

      return res.apiv3({ userGroupRelations: serialized });
    }
    catch (err) {
      const msg = 'Error occurred in fetching user group relations';
      logger.error('Error', err);
      return res.apiv3Err(new ErrorV3(msg, 'user-group-relation-list-fetch-failed'));
    }
  });

  return router;
};

// const MAX_PAGE_LIST = 50;

// function createPager(total, limit, page, pagesCount, maxPageList) {
//   const pager = {
//     page,
//     pagesCount,
//     pages: [],
//     total,
//     previous: null,
//     previousDots: false,
//     next: null,
//     nextDots: false,
//   };

//   if (page > 1) {
//     pager.previous = page - 1;
//   }

//   if (page < pagesCount) {
//     pager.next = page + 1;
//   }

//   let pagerMin = Math.max(1, Math.ceil(page - maxPageList / 2));
//   let pagerMax = Math.min(pagesCount, Math.floor(page + maxPageList / 2));
//   if (pagerMin === 1) {
//     if (MAX_PAGE_LIST < pagesCount) {
//       pagerMax = MAX_PAGE_LIST;
//     }
//     else {
//       pagerMax = pagesCount;
//     }
//   }
//   if (pagerMax === pagesCount) {
//     if ((pagerMax - MAX_PAGE_LIST) < 1) {
//       pagerMin = 1;
//     }
//     else {
//       pagerMin = pagerMax - MAX_PAGE_LIST;
//     }
//   }

//   pager.previousDots = null;
//   if (pagerMin > 1) {
//     pager.previousDots = true;
//   }

//   pager.nextDots = null;
//   if (pagerMax < pagesCount) {
//     pager.nextDots = true;
//   }

//   for (let i = pagerMin; i <= pagerMax; i++) {
//     pager.pages.push(i);
//   }

//   return pager;
// }
