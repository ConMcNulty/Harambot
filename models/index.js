const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const Lists = sequelize.define('lists', {
    user_id: {
        type: Sequelize.STRING,
        unique: false,
    },
    item: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

const Characters = sequelize.define('characters', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = { Lists, Characters, sequelize };