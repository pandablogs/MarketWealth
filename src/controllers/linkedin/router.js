const express = require('express');
const router = express.Router();
const crawl_main = require('./crawl_main');

module.exports = {
    getMainArticle: crawl_main.getMainArticle
};

