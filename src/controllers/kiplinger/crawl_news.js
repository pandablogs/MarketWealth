const mongodb = require("../../models/mongodb");

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const getLists = async () => {
    return new Promise(async (resolve, reject) => {
        try {

            console.log("Start sync kiplinger news");
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

            await page.goto('https://www.kiplinger.com/investing', {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            })

            // await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__article-group--articles .polaris__article-card a"), (data) => data.href));
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
            console.log("complete sync kiplinger news \n");
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

            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__content .polaris__heading--title"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__content .polaris__heading--subtitle"), (data) => data.innerText));
            const row_elements_content = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main"), (data) => data.innerText));
            const row_elements_img = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main .polaris__image--fixed-container img"), (data) => data.src));
            const list_contents = await page.evaluate(() => Array.from(document.body.querySelectorAll('.polaris__simple-grid--main'), (data) => data.innerHTML).filter((x, i) => ![0, 1].includes(i)));

            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--facebook"), data => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--twitter"), data => data.href));
            const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--email"), data => data.href));
            const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--linkedin"), data => data.href));


            let image = (row_elements_img && row_elements_img.length != 0) ? row_elements_img[0] : "";
            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";
            let content = (row_elements_content && row_elements_content.length != 0) ? row_elements_content[1] : "";

            let title = (row_elements && row_elements.length != 0) ? row_elements[0] : "";
            const payload = {
                title: title,
                uuid : title.toLocaleLowerCase().replace(/ /g,'-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}\n\n${content}`],
                image: image.replace("image-mobile", "image-desktop"),
                link: url,
                type: 'kiplinger',
                groupType: 'investing_news',
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
        resolve(true)
    }
}

module.exports = {
    getLists
}

// { width: 1920, height: 5080 }