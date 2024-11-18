const express = require('express');
const router = express.Router();
const crawl_main = require('./crawl_main');
const crawl_latest_article = require('./crawl_latest_article');
const crawl_new_news = require('./crawl_new_news');

module.exports = {
    getMainArticle: crawl_main.getMainArticle,
    getLatesArticleNews: crawl_latest_article.getLists,
    getNews: crawl_new_news.onLoadnewsList,
};

