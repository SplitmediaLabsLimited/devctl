module.exports = {
  mongo: {
    versions: ['3.4-xenial', '3.6-xenial', '4.0-xenial'],
    default: {
      defaultPort: 27017,
      defaultMount: '/data/db',
    },
    env: [
      {
        name: 'MONGO_INITDB_ROOT_USERNAME',
        message: 'MONGO_INITDB_ROOT_USERNAME',
        initial: 'dev-user',
      },
      {
        name: 'MONGO_INITDB_ROOT_PASSWORD',
        message: 'MONGO_INITDB_ROOT_PASSWORD',
        initial: 'dev-password',
      },
    ],
  },
  mysql: {
    versions: ['5.6', '5.7', '8.0'],
    default: {
      defaultPort: 3306,
      defaultMount: '/var/lib/mysql',
    },
    env: [
      {
        name: 'MYSQL_ROOT_PASSWORD',
        message: 'MYSQL_ROOT_PASSWORD',
        initial: 'dev-root-password',
      },
      {
        name: 'MYSQL_DATABASE',
        message: 'MYSQL_DATABASE',
        initial: 'dev-database',
      },
      {
        name: 'MYSQL_USER',
        message: 'MYSQL_USER',
        initial: 'dev-user',
      },
      {
        name: 'MYSQL_PASSWORD',
        message: 'MYSQL_PASSWORD',
        initial: 'dev-password',
      },
    ],
  },
  postgres: {
    versions: [
      '9.4-alpine',
      '9.5-alpine',
      '9.6-alpine',
      '10-alpine',
      '11-alpine',
    ],
    default: {
      defaultPort: 5432,
      defaultMount: '/var/lib/postgresql/data',
    },
    env: [
      {
        name: 'POSTGRES_DB',
        message: 'POSTGRES_DB',
        initial: 'dev-database',
      },
      {
        name: 'POSTGRES_USER',
        message: 'POSTGRES_USER',
        initial: 'dev-user',
      },
      {
        name: 'POSTGRES_PASSWORD',
        message: 'POSTGRES_PASSWORD',
        initial: 'dev-password',
      },
    ],
  },

  redis: {
    versions: ['4.0-alpine', '5.0-alpine'],
    default: {
      defaultPort: 6379,
      defaultMount: '/data',
    },
    env: [],
  },
};
