/**
 * @see https://www.npmjs.com/package/mongoose-paginate-v2
 * @swagger
 *
 *  components:
 *    schemas:
 *      PaginateResult:
 *        description: PaginateResult
 *        type: object
 *        properties:
 *          docs:
 *            type: array
 *            description: Array of documents
 *            items:
 *              type: object
 *          totalDocs:
 *            type: number
 *            description: Total number of documents in collection that match a query
 *          limit:
 *            type: number
 *            description: Limit that was used
 *          hasPrevPage:
 *            type: number
 *            description: Availability of prev page.
 *          hasNextPage:
 *            type: number
 *            description: Availability of next page.
 *          page:
 *            type: number
 *            description: Current page number
 *          totalPages:
 *            type: number
 *            description: Total number of pages.
 *          offset:
 *            type: number
 *            description: Only if specified or default page/offset values were used
 *          prefPage:
 *            type: number
 *            description: Previous page number if available or NULL
 *          nextPage:
 *            type: number
 *            description: Next page number if available or NULL
 *          pagingCounter:
 *            type: number
 *            description: The starting sl. number of first document.
 *          meta:
 *            type: number
 *            description: Object of pagination meta data (Default false).
 *
 */

/**
 * @swagger
 *
 *  components:
 *    schemas:
 *      V1PaginateResult:
 *        description: Paginate result v1
 *        type: object
 *        properties:
 *          meta:
 *            type: object
 *            properties:
 *              total:
 *                type: integer
 *                description: Total number of documents in collection that match a query
 *                example: 35
 *              limit:
 *                type: integer
 *                description: Limit that was used
 *                example: 10
 *              offset:
 *                type: integer
 *                description: Only if specified or default page/offset values were used
 *                example: 20
 *          data:
 *            type: object
 *            description: Object of pagination meta data.
 */
