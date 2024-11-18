//New UI Update link on 13-10-22
import mongodb from '../../models/mongodb';
import moment from 'moment';
import utility from "../../utility/scroll_page";
function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}
const onLoadnewsList = async () => {
    try {
        let count = 1;
        const limit = 8;
        while (limit >= count) {
            if (count == 1) {
                await getLists(`https://www.kiplinger.com/investing`)
            } else {
                console.log(`https://www.kiplinger.com/investing/page/${count}`)
                await getLists(`https://www.kiplinger.com/investing/page/${count}`)
            }
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

            console.log("Start sync investing news");
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

            await page.goto(url, {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            })

            // await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".listing__list.listing__list--alternate .listing__item section"), (data) => {
                return {
                    link: data.querySelector('a') ? data.querySelector('a').href : "",
                    post_date: data.querySelector('.date.byline__time') ? data.querySelector('.date.byline__time').innerText : ""
                }
            }));

            browser.close();

            console.log("Before => ", row_elements.length);
            const row_elements_link_lists = row_elements.map(x => x.link)
            const jsonData = await mongodb.items.find({ link: { $in: row_elements_link_lists } }).select('link');;
            let latestList = row_elements.filter(x => !jsonData.some(y => y.link == x.link));
            console.log("After => ", latestList.length);
            let count = 0;
            while (latestList.length > count) {
                console.log(`count : ${count + 1} | Link : ${latestList[count].link}`);
                await GetNewDetails(latestList[count])
                count++;
            }
            console.log("complete sync investing news \n");
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

const GetNewDetails = (requestPayload) => {
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

            await page.goto(requestPayload.link, {
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

            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".news-article .header__title"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll(".news-article .header__strapline"), (data) => data.innerText));
            const row_elements_content = await page.evaluate(() => Array.from(document.querySelectorAll(".news-article .article__container.article__container-sidebar p"), (data) => data.innerText));
            const row_elements_img = await page.evaluate(() => Array.from(document.querySelectorAll(".news-article .image-hero__padding img"), (data) => data.src));
            const list_contents = await page.evaluate(() => Array.from(document.body.querySelectorAll('.news-article .article__container.article__container-sidebar p'), (data) => data.innerHTML));

            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".social__items .social__item a.social__facebook"), data => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".social__items .social__item a.social__twitter"), data => data.href));
            const social_mail = null;
            const social_linkedin = null;


            let image = (row_elements_img && row_elements_img.length != 0) ? row_elements_img[0] : "";
            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";
            let content = (row_elements_content && row_elements_content.length != 0) ? row_elements_content[1] : "";

            let title = (row_elements && row_elements.length != 0) ? row_elements[0] : "";

            let postDate = new Date();

            console.log("==================================")
            console.log(requestPayload.post_date);


            if (requestPayload.post_date.toLocaleLowerCase().search("days") >= 0) {
                postDate = utility.getDateXDaysAgo(parseInt(requestPayload.post_date))
            } else if (requestPayload.post_date.toLocaleLowerCase().search("hours") >= 0) {
                postDate = utility.getDateXHoursAgo(parseInt(requestPayload.post_date))
            } else if (requestPayload.post_date.toLocaleLowerCase().search("minutes") >= 0) {
                postDate = utility.getDateXMinuteAgo(parseInt(requestPayload.post_date))
            } else if (requestPayload.post_date.toLocaleLowerCase().search("seconds") >= 0) {
                postDate = utility.getDateXSecondAgo(parseInt(requestPayload.post_date))
            }

            console.log(postDate);
            console.log("==================================")

            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}\n\n${content}`],
                image: image.replace("image-mobile", "image-desktop"),
                link: requestPayload.link,
                type: 'kiplinger',
                groupType: 'investing_news',
                list_contents: list_contents,
                updatedAt: postDate,
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
        resolve(true)
    }
}

module.exports = {
    onLoadnewsList
}

// { width: 1920, height: 5080 }