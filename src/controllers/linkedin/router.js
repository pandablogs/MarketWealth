import express from 'express';
import router from express.Router();

import crawl_main from './crawl_main';
module.exports = {
    getMainArticle: crawl_main.getMainArticle
};

