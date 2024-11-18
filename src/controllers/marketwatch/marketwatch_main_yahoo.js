import mongodb from '../../models/mongodb';

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const getMainArticle = async () => {

    return new Promise(async (resolve, reject) => {
        try {
            console.log("start sync Yahoo news");
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--window-size=1920,10000'
                ]
            });

            const page = await browser.newPage()
            page.setViewport({ width: 1920, height: 10000 });
            await page.goto('https://finance.yahoo.com', {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            })


            await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.body.querySelectorAll('.js-stream-content .js-content-viewer'), (data) => data.href));

            console.log(row_elements[0]);
            if (row_elements) {
                await GetNewDetails(row_elements[0]);
            }
            console.log("sync Hero dashboard news \n");
            resolve(true)
        } catch (err) {
            console.log(err);
            resolve(true)
        }
    })

}

const GetNewDetails = (url) => {
    try {
        return new Promise(async (resolve, reject) => {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            const page = await browser.newPage()

            await page.goto(url, {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            });

            //await scrollPage.pagLoad(page);
            //  await GetMoreStory(page)

            const row_elements = await page.evaluate(() => Array.from(document.body.querySelectorAll('.caas-title-wrapper'), (data) => data.innerText));
            const row_elements_content = await page.evaluate(() => Array.from(document.body.querySelectorAll('.caas-body'), (data) => data.innerText));
            const row_elements_img = await page.evaluate(() => Array.from(document.body.querySelectorAll('.caas-img-container .caas-img'), (data) => data.src));
            const row_elements_img2 = await page.evaluate(() => Array.from(document.body.querySelectorAll('.vp-start-screen-image'), (data) => data.src));
            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".caas-share-buttons a.facebook"), data => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".caas-share-buttons a.twitter"), data => data.href));
            const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".caas-share-buttons a.mail"), data => data.href));

            const title = (row_elements && row_elements.length != 0) ? row_elements[0] : "";
            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: row_elements_content,
                image: (row_elements_img && row_elements_img.length != 0) ? row_elements_img[0] : row_elements_img2[0],
                link: url,
                type: 'marketwatch',
                groupType: 'main_article_news',
                social_links: {
                    facebook: (social_facebook && social_facebook.length != 0) ? social_facebook[0] : "",
                    twitter: (social_twitter && social_twitter.length != 0) ? social_twitter[0] : "",
                    mail: (social_mail && social_mail.length != 0) ? social_mail[0] : "",
                    whatsapp: "",
                }
            }

            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {
                const latestDataId = await mongodb.items.findOne({ groupType: 'main_article_news', type: 'marketwatch' });
                if (latestDataId) {
                    await mongodb.items.updateOne({ _id: latestDataId._id, }, { $set: { groupType: 'main_article_news_old' } });
                }
                await mongodb.items.create(payload);
                browser.close();
                resolve(true)
            } else {
                resolve(true)
            }
        })

    } catch (err) {
        resolve(true)
    }
}


const GetDetails = (url) => {
    try {
        return new Promise(async (resolve, reject) => {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    // '--window-size=1920,2800',
                ]
            });
            const page = await browser.newPage()
            // page.setViewport({ 
            //     // width: 1920, height: 2800
            //  });

            await page.goto(url, {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            });

            const bodyHandle = await page.$('body');
            const { height } = await bodyHandle.boundingBox();
            await bodyHandle.dispose();

            // Scroll one viewport at a time, pausing to let content load
            const viewportHeight = page.viewport().height;
            let viewportIncr = 0;
            while (viewportIncr + viewportHeight < height) {
                await page.evaluate(_viewportHeight => {
                    window.scrollBy(0, _viewportHeight);
                }, viewportHeight);
                await wait(300);
                viewportIncr = viewportIncr + viewportHeight;
            }

            // Scroll back to top
            await page.evaluate(_ => {
                window.scrollTo(0, 0);
            });

            // Some extra delay to let images load
            await wait(100);

            // await page.screenshot({ path: 'example.png' });
            const polaris_heading = await page.evaluate(() => Array.from(document.querySelectorAll(".article__header .article__headline"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll(".article__header .article__subhead"), (data) => data.innerText));
            const polaris_heading_img = await page.evaluate(() => Array.from(document.querySelectorAll(".article__header .article__inset__image__image img"), (data) => data.src));
            const polaris_heading_img_one = await page.evaluate(() => Array.from(document.querySelectorAll(".img-header .article__inset__image__image img"), (data) => data.src));
            const polaris_content = await page.evaluate(() => Array.from(document.querySelectorAll(".article__content .article__body p"), (data) => data.innerText));
            const list_contents = await page.evaluate(() => Array.from(document.body.querySelectorAll('.article__content .article__body p'), (data) => data.innerHTML));

            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".article__social .js-facebook"), data => data.getAttribute('data-url')));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".article__social .js-twitter"), data => data.getAttribute('data-url')));
            const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".article__social .js-email"), data => data.getAttribute('data-url')));
            const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".article__social .js-linkedin"), data => data.getAttribute('data-url')));


            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";
            let content = (polaris_content && polaris_content.length != 0) ? polaris_content[1] : "";
            let image = (polaris_heading_img && polaris_heading_img.length != 0) ? polaris_heading_img[0] : "";
            image = (image && image != "") ? image : (polaris_heading_img_one && polaris_heading_img_one.length != 0) ? polaris_heading_img_one[0] : "";

            let title = (polaris_heading && polaris_heading.length != 0) ? polaris_heading[0] : "";
            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}\n\n${content}`],
                image: image.replace("image-mobile", "image-desktop"),
                link: url,
                type: 'marketwatch',
                groupType: 'main_article_news',
                list_contents: list_contents,
                social_links: {
                    facebook: (social_facebook && social_facebook.length != 0) ? social_facebook[0] : "",
                    twitter: (social_twitter && social_twitter.length != 0) ? social_twitter[0] : "",
                    mail: (social_mail && social_mail.length != 0) ? social_mail[0] : "",
                    linkedin: (social_linkedin && social_linkedin.length != 0) ? social_linkedin[0] : "",
                    whatsapp: "",
                }
            }

            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {
                const latestDataId = await mongodb.items.findOne({ groupType: 'main_article_news', type: 'marketwatch' });
                if (latestDataId) {
                    await mongodb.items.updateOne({ _id: latestDataId._id, }, { $set: { groupType: 'main_article_news_old' } });
                }
                await mongodb.items.create(payload);
                browser.close();
                resolve(true)
            } else {
                resolve(true)
            }
        })
    } catch (err) {
        console.log(err);
        resolve(true)
    }
}

module.exports = {
    getMainArticle
}