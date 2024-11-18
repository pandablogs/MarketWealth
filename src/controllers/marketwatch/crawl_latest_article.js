import mongodb from '../../models/mongodb';

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const getLists = async () => {
    return new Promise(async (resolve, reject) => {
        try {

            console.log("Start sync latest news");
            const puppeteer = require('puppeteer');

            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    // '--window-size=1920,10000'
                ]
            });
            const page = await browser.newPage()
            // page.setViewport({ width: 1920, height: 10000 });

            await page.goto('https://www.marketwatch.com', {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            })

            console.log("https://www.marketwatch.com");

            // await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".group--articles .article__headline a"), (data) => data.href));
            browser.close();

            console.log("Before => ", row_elements.length);
            const jsonData = await mongodb.items.find({ link: { $in: row_elements } }).select('link');;
            let latestList = row_elements.filter(x => !jsonData.some(y => y.link == x));
            console.log("After => ", latestList.length);
            let count = 0;
            while (latestList.length > count) {
                console.log(`count : ${count + 1} | Link : ${latestList[count]}`);
                await GetNewDetails(latestList[count])
                count++;
            }
            console.log("complete sync latest news \n");
            resolve(true)
            // res.send({
            //     status: true,
            //     lists: latestList,
            //     totalList: latestList.length
            // })

        } catch (err) {
            console.log(err);
            resolve(true)
            // res.send({
            //     status: false,
            //     message: err.message
            // })
        }
    })

}

const GetNewDetails = (url) => {
    try {
        return new Promise(async (resolve, reject) => {
            const puppeteer = require('puppeteer');
            // const browser = await puppeteer.launch({
            //     args: [
            //         '--window-size=1920,2800',
            //     ],
            // })

            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    // '--window-size=1920,2800',
                ]
            });
            const page = await browser.newPage()
            // page.setViewport({ width: 1920, height: 10000 });

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
            // await page.screenshot({ path: `${new Date().getTime()}.png` });

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
                groupType: 'latest_news',
                list_contents: list_contents,
                social_links: {
                    facebook: (social_facebook && social_facebook.length != 0) ? social_facebook[0] : "",
                    twitter: (social_twitter && social_twitter.length != 0) ? social_twitter[0] : "",
                    mail: (social_mail && social_mail.length != 0) ? social_mail[0] : "",
                    linkedin: (social_linkedin && social_linkedin.length != 0) ? social_linkedin[0] : "",
                    whatsapp: "",
                }
            }

            console.log(payload)

            browser.close();
            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {
                await mongodb.items.create(payload);
                resolve(true)
            } else {
                resolve(true)
            }

        })

    } catch (err) {
        console.log(err)
        resolve(true)
    }
}

module.exports = {
    getLists
}

// { width: 1920, height: 5080 }