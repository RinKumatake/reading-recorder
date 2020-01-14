'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/reading_recorder',
  {
    operatorsAliases: false
  });

  module.exports = {
    database: sequelize,
    Sequelize: Sequelize
  };