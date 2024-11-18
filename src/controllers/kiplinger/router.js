import express from 'express';
import router from express.Router();

import crawl_main from './crawl_main';
import crawl_latest_article from './crawl_latest_article';
import crawl_new_news from './crawl_new_news';
module.exports = {
    getMainArticle: crawl_main.getMainArticle,
    getLatesArticleNews: crawl_latest_article.getLists,
    getNews: crawl_new_news.onLoadnewsList,
};

