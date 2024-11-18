const mongodb = require("../../models/mongodb");

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const onHandler = async () => {

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
            await page.goto('https://www.cnbc.com/world/?region=world', {
                timeout: 0,
                waitUntil: [
                    'load',
                    'domcontentloaded',
                ]
            })


            await page.screenshot({ path: 'example.png' });
            const row_elements = await page.evaluate(() => Array.from(document.querySelectorAll(".LatestNews-isHomePage .LatestNews-list .LatestNews-headlineWrapper a" ), (data) => data.href));
        

            browser.close();

            console.log("Before => ", row_elements.length);
            const jsonData = await mongodb.items.find({ link: { $in: row_elements } }).select('link');;
            let latestList = row_elements.filter(x=> (x && x.includes(".html"))).filter(x => !jsonData.some(y => y.link == x));
            console.log("After => ", latestList.length);
            let count = 0;
            const latestList2 = latestList.slice(0, 10);
            while (latestList2.length > count) {
                console.log(`count : ${count + 1} | Link : ${latestList[count]}`);
                await GetDetails(latestList[count])
                count++;
            }
            console.log("complete sync latest news \n");
            resolve(true)
        } catch (err) {
            console.log(err);
            resolve(true)
        }
    })

}

//https://www.cnbc.com/2024/10/29/cnbc-daily-open-stocks-are-approaching-the-hottest-period-of-the-year.html
const GetDetails = (url) => {
    try {
       // url = "https://www.cnbc.com/2024/10/29/cnbc-daily-open-stocks-are-approaching-the-hottest-period-of-the-year.html"
        return new Promise(async (resolve, reject) => {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--start-maximized',
                ]
            });
            var page = await browser.newPage();
            await page.setViewport({
                width: 1024,
                height: 4280,
                deviceScaleFactor: 1
            });
           // await page.emulateMedia('screen');

            await page.goto(url, {
                timeout: 0,
                waitUntil: ['load', 'domcontentloaded', 'networkidle2', 'networkidle0']
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
            await page.screenshot({ path: "example.png" });


            const polaris_heading = await page.evaluate(() => Array.from(document.querySelectorAll("header h1.ArticleHeader-headline"), (data) => data.innerText));
            const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll(".InlineImage-wrapper .InlineImage-imageEmbedCaption"), (data) => data.innerText));
            const polaris_heading_img = await page.evaluate(() => Array.from(document.querySelectorAll(".InlineImage-imageContainer picture img"), (data) => data.src));
            const list_contents = await page.evaluate(() =>  Array.from(Array.from(document.querySelector('.ArticleBody-articleBody')?.children || []).filter(childElement=>  (childElement.className == 'group' || childElement.className == 'ArticleBody-subtitle')),(data) => data.innerHTML));
            const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--facebook"), data => data.href));
            const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--twitter"), data => data.href));
            const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--email"), data => data.href));
            const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--linkedin"), data => data.href));
            debugger
          
           

            let sub_title = (polaris_heading_subtitle && polaris_heading_subtitle.length != 0) ? polaris_heading_subtitle[0] : "";
            let image = (polaris_heading_img && polaris_heading_img.length != 0) ? polaris_heading_img[0] : "";
            let title = (polaris_heading && polaris_heading.length != 0) ? polaris_heading[0] : "";

            const payload = {
                title: title,
                uuid: title.toLocaleLowerCase().replace(/ /g, '-').replace(/[^\w\s-]/gi, ''),
                contents: [`${sub_title}`],
                image: image.replace("image-mobile", "image-desktop"),
                link: url,
                type: 'yahoo',
                groupType: 'top_news',
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
                await mongodb.items.create(payload);
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
    onHandler 
}