const mongodb = require("../../models/mongodb");

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const getMainArticle = async () => {

    return new Promise(async (resolve, reject) => {
        try {
            console.log("sync kiplinger dashboard news");

            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--window-size=1920,1080'
                ]
            });


            const page = await browser.newPage()
            page.setViewport({ width: 1920, height: 1080 });

            await page.goto('https://www.kiplinger.com', {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            });

            await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll("div .-home-hero .polaris__article-card.polaris__article-group--single .polaris__link"), (data) => data.href));
            browser.close();
            const latestData = await mongodb.items.count({ groupType: 'main_article_news', type: 'kiplinger', link: row_elements[0] })
            if (latestData == 0) {
                await GetDetails(row_elements[0]);
            }
            console.log("complete kiplinger dashboard news \n");
            resolve(true)
        } catch (err) {
            console.log(err);
            resolve(true)
        }
    })

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
            const polaris_heading = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__content .polaris__heading--title"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__content .polaris__heading--subtitle"), (data) => data.innerText));
            const polaris_heading_img = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main .polaris__image--fixed-container img"), (data) => data.src));
            const polaris_content = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main"), (data) => data.innerText));

            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--facebook"), data => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--twitter"), data => data.href));
            const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--email"), data => data.href));
            const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--linkedin"), data => data.href));
            const list_contents = await page.evaluate(() => Array.from(document.body.querySelectorAll('.polaris__simple-grid--main'), (data) => data.innerHTML).filter((x, i) => ![0, 1].includes(i)));

            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";
            let content = (polaris_content && polaris_content.length != 0) ? polaris_content[1] : "";
            let image = (polaris_heading_img && polaris_heading_img.length != 0) ? polaris_heading_img[0] : "";

            let title = (polaris_heading && polaris_heading.length != 0) ? polaris_heading[0] : "";

            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}\n\n${content}`],
                image: image.replace("image-mobile", "image-desktop"),
                link: url,
                type: 'kiplinger',
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

            console.log(payload);

            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {


                const latestDataId = await mongodb.items.findOne({ groupType: 'main_article_news', type: 'kiplinger' }).select('_id')
                if (latestDataId) {
                    await mongodb.items.updateOne({ _id: latestDataId._id, }, { $set: { groupType: 'latest_news' } });
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