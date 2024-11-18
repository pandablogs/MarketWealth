const mongodb = require("../../models/mongodb");
const scrollPage = require('../../utility/scroll_page');


const crawl_list_pages = async () => {
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
            console.log("Before => ", row_elements.length);
            const jsonData = await mongodb.items.find({ link: { $in: row_elements } }).select('link');
            let latestList = row_elements.filter(x => !jsonData.some(y => y.link == x));
            console.log("After => ", latestList.length);
            browser.close();

            let count = 0;
            while (latestList.length > count) {
                console.log(`count : ${count + 1} | Link : ${latestList[count]}`);
                await GetNewDetails(latestList[count])
                count++;
            }


            resolve(true)

        } catch (err) {
            console.log(err);
            resolve(true)
        }
    })

}

const GetMoreStory = async (page) => {
    try {
        const form = await page.$('.caas-readmore button');
        await form.evaluate(form => form.click());
    } catch (err) {
        return page
    }
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

            await scrollPage.pagLoad(page);
            await GetMoreStory(page)

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
                uuid: title.toLocaleLowerCase().replace(/ /g,'-').replace(/[^\w\s-]/gi, ''),
                contents: row_elements_content,
                image: (row_elements_img && row_elements_img.length != 0) ? row_elements_img[0] : row_elements_img2[0],
                link: url,
                type: 'yahoo',
                groupType: 'top_news',
                social_links: {
                    facebook: (social_facebook && social_facebook.length != 0) ? social_facebook[0] : "",
                    twitter: (social_twitter && social_twitter.length != 0) ? social_twitter[0] : "",
                    mail: (social_mail && social_mail.length != 0) ? social_mail[0] : "",
                    whatsapp: "",
                }
            }

            console.log(payload);
            browser.close();
            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {
                await mongodb.items.create(payload);
                resolve(true)
            } else {
                resolve(true)
            }
        })

    } catch (err) {
        resolve(true)
    }
}



module.exports = {
    crawl_list_pages
}