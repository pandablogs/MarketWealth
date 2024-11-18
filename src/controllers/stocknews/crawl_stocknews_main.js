const mongodb = require("../../models/mongodb");
const moment = require('moment')

// Fri, Oct 7, 2022 5:30 PM
function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const onLoadnewsList = async () => {
    try {
        let count = 1;
        const limit = 10;
        while (limit >= count) {
            await getLists(`https://stocknews.com/top-stories/?pg=${count}`)
            count++;
        }
        return true;
    } catch (err) {
        return true;
    }
}

const getLists = async (url) => {
    return new Promise(async (resolve, reject) => {
        try {

            console.log("Start sync stocknews news");
            const puppeteer = require('puppeteer');


            // const browser = await puppeteer.launch({
            //     // executablePath: '/usr/bin/chromium-browser',
            //     // headless:false,
            //     args: [
            //         // "--no-sandbox",
            //         '--window-size=1920,10000',
            //     ],
            // })

            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    // '--window-size=1920,10000'
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
            })

            // await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll("#content article .row .margin-bottom "), (data) => {
                return {
                    link: data.querySelector('.pad-top h3 a') ? data.querySelector('.pad-top h3 a').href : "",
                    post_date: data.querySelector('.post-meta.zero-padding') ? data.querySelector('.post-meta.zero-padding').innerText : ""
                }
            }));
            browser.close();
            console.log("Before => ", row_elements.length);
            const linkLists = row_elements.map(x => x.link)
            const jsonData = await mongodb.items.find({ link: { $in: linkLists } }).select('link');
            let latestList = row_elements.filter(x => !jsonData.some(y => y.link == x.link))
            console.log("After => ", latestList.length);
            let count = 0;
            while (latestList.length > count) {
                console.log(`count : ${count + 1} | Link : ${latestList[count].link}`);
                await GetNewDetails(latestList[count])
                count++;
            }
            console.log("complete sync stocknews news \n");
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

const GetNewDetails = (request) => {
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

            await page.goto(request.link, {
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

            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".news-event .page-title"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll(".news-event .panel-body .row .col-lg-12 p"), (data) => data.innerText));
            const row_elements_img = await page.evaluate(() => Array.from(document.querySelectorAll(".news-event .panel-body > .row img"), (data) => data.src));
            const list_contents = await page.evaluate(() => Array.from(document.querySelectorAll(".post_content#articlecontent p"), (data) => data.innerHTML));

            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".post-meta .sn-social-share.btn-facebook"), (data) => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".post-meta .sn-social-share.btn-twitter"), (data) => data.href));
            const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".post-meta .sn-social-share.btn-linkedin"), data => data.href));

            let image = (row_elements_img && row_elements_img.length != 0) ? row_elements_img[0] : "";
            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";

            let title = (row_elements && row_elements.length != 0) ? row_elements[0] : "";


            let date = request.post_date;
            let date1 = date.split("|")[0].replace(",", "").trim().replace(/ /g, ", ");
            let date2 = date.split("|")[1].replace(",", "").trim().replace(/ /g, ", ").toLocaleUpperCase()
            let dl = (date2.length - 2);
            console.log(moment(`${date1} ${date2.slice(0, dl)} ${date2.slice(dl)}`).format());

            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}\n`],
                image: image.replace("image-mobile", "image-desktop"),
                link: request.link,
                type: 'stocknews',
                groupType: 'stock_news',
                list_contents: list_contents,
                updatedAt : moment(`${date1} ${date2.slice(0, dl)} ${date2.slice(dl)}`).format(),
                social_links: {
                    facebook: (social_facebook && social_facebook.length != 0) ? social_facebook[0] : "",
                    twitter: (social_twitter && social_twitter.length != 0) ? social_twitter[0] : "",
                    linkedin: (social_linkedin && social_linkedin.length != 0) ? social_linkedin[0] : "",
                    mail: "",
                    whatsapp: "",
                }
            }
            browser.close();
            if (payload.title != "" && payload.contents != "" && payload.image != "" && payload.link != "") {
                let data = [];
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
    onLoadnewsList
}

// { width: 1920, height: 5080 }