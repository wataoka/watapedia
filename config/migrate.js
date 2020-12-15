/**
 * Configuration file for migrate-mongo
 * @see https://github.com/seppevs/migrate-mongo
 *
 * @author Yuki Takei <yuki@weseek.co.jp>
 */

require('module-alias/register');

function getMongoUri(env) {
  return 'mongodb+srv://heroku_s632g709:Onethe9ryu@cluster0.osf1b.mongodb.net/heroku_s632g709?retryWrites=true&w=majority'
  // env.MONGOLAB_URI // for B.C.
  //   || env.MONGODB_URI // MONGOLAB changes their env name
  //   || env.MONGOHQ_URL
  //   || env.MONGO_URI
  //   || ((env.NODE_ENV === 'test') ? 'mongodb://localhost/growi_test' : 'mongodb://localhost/growi');
}

const mongoUri = getMongoUri(process.env);
const match = mongoUri.match(/^(.+)\/([^/]+)$/);

module.exports = {
  mongoUri,
  mongodb: {
    url: match[0],
    databaseName: match[2],
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
    },
  },
  migrationsDir: 'src/migrations/',
  changelogCollectionName: 'migrations',
};
