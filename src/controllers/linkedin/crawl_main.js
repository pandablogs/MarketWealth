const mongodb = require("../../models/mongodb");

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const getMainArticle = async () => {

    return new Promise(async (resolve, reject) => {
        try {
            const puppeteer = require('puppeteer');
            // const browser = await puppeteer.launch({
            //     'args': [
            //         '--no-sandbox',
            //         '--disable-setuid-sandbox',
            //         // '--window-size=1920,2800',
            //     ]
            // });
            const browser = await puppeteer.launch({
                headless: false
            });
            const page = await browser.newPage();
            await page.goto('https://www.linkedin.com/home');
            // await page.waitForTimeout(5000); // wait for 5 seconds
            await page.type('#session_key', "anupmourya484@gmail.com");
            await page.type('#session_password', "Welcome@@2022");
            page.click('.sign-in-form__submit-button'),
                await page.waitForTimeout(5000); // wait for 5 seconds
            await page.goto('https://www.linkedin.com/in/aarondfrancis');

            const profile_image = await page.evaluate(() => Array.from(document.querySelectorAll(".pv-top-card-profile-picture__image"), (data) => data.src));
            const profile_name = await page.evaluate(() => Array.from(document.querySelectorAll(".text-heading-xlarge"), (data) => data.innerText));
            const profile_info1 = await page.evaluate(() => Array.from(document.querySelectorAll(".pv-text-details__left-panel .text-body-medium"), (data) => data.innerText));
            const profile_info2 = await page.evaluate(() => Array.from(document.querySelectorAll(".pv-text-details__left-panel span.text-body-small"), (data) => data.innerText));
            // const profile_info3 = await page.evaluate(() => Array.from(document.querySelectorAll(".pv-text-details__left-panel .text-body-medium"), (data) => data.innerText));
            let CurrentCompanyLog = await page.evaluate(() => Array.from(document.querySelectorAll("section")[5].querySelectorAll('li.artdeco-list__item img'), (data) => data.src));
            let CurrentCompanyInfo = await page.evaluate(() => Array.from(document.querySelectorAll("section")[5].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span'), (data) => data.innerText));
          
            if (CurrentCompanyLog.length == 0) {
                CurrentCompanyLog = await page.evaluate(() => Array.from(document.querySelectorAll("section")[6].querySelectorAll('li.artdeco-list__item img'), (data) => data.src));
                CurrentCompanyInfo = await page.evaluate(() => Array.from(document.querySelectorAll("section")[6].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span'), (data) => data.innerText));
            }
            
            const educationlogo = await page.evaluate(() => Array.from(document.querySelectorAll("section")[6].querySelectorAll('li.artdeco-list__item img'), (data) => data.src));
            const educationInfo = await page.evaluate(() => Array.from(document.querySelectorAll("section")[6].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span'), (data) => data.innerText));
            const skill = await page.evaluate(() => Array.from(document.querySelectorAll("section")[8].querySelectorAll('.pvs-list__outer-container ul li .display-flex span.mr1 span'), (data) => data.innerText));

            console.log({
                profile_link: "https://www.linkedin.com/in/aaron-paul-474bb6",
                profile_image: profile_image[0],
                profile_name: profile_name[0],
                title: profile_info1[0],
                location: profile_info2[0],
                current_company: {
                    logo: CurrentCompanyLog,
                    name: CurrentCompanyInfo[3],
                    role: CurrentCompanyInfo[1]
                },
                education: {
                    logo: educationlogo[0],
                    collage_name: educationInfo[1],
                    degree: educationInfo[2],
                    passing_year: educationInfo[4]
                },
                skills: skill
            })
            // const polaris_heading_subtitle = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__content .polaris__heading--subtitle"), (data) => data.innerText));
            // const polaris_heading_img = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main .polaris__image--fixed-container img"), (data) => data.src));
            // const polaris_content = await page.evaluate(() => Array.from(document.querySelectorAll("main .polaris__simple-grid--main"), (data) => data.innerText));

            // const social_facebook = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--facebook"), data => data.href));
            // const social_twitter = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--twitter"), data => data.href));
            // const social_mail = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--email"), data => data.href));
            // const social_linkedin = await page.evaluate(() => Array.from(document.querySelectorAll(".polaris__social a.polaris__social--linkedin"), data => data.href));
            // const list_contents = await page.evaluate(() => Array.from(document.body.querySelectorAll('.polaris__simple-grid--main'), (data) => data.innerHTML).filter((x, i) => ![0, 1].includes(i)));



            // document.querySelector('.pv-top-card-profile-picture__image').src
            // document.querySelector('.text-heading-xlarge').innerText
            // document.querySelector('.pv-text-details__left-panel .text-body-medium').innerText
            // document.querySelector('.pv-text-details__left-panel span.text-body-small').innerText
            // document.querySelectorAll('#ember110 li.artdeco-list__item ')[0]

            // //Company Logo
            // document.querySelectorAll('section')[5].querySelector('li.artdeco-list__item img').src
            // //Company name
            // document.querySelectorAll('section')[5].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span')[2].innerText
            // //Company postion
            // document.querySelectorAll('section')[5].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span')[0].innerText



            // //Education
            // document.querySelectorAll('section')[6].querySelector('li.artdeco-list__item img').src
            // document.querySelectorAll('section')[6].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span')[1].innerText
            // 'Austin Community College'
            // document.querySelectorAll('section')[6].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span')[2].innerText
            // 'Associate of Applied Science, Computer Programming'
            // document.querySelectorAll('section')[6].querySelectorAll('li.artdeco-list__item div.pvs-entity  div.display-flex span span')[4].innerText
            // '2015 - 2016'

            // document.querySelectorAll('section')[8].querySelectorAll(".pvs-list__outer-container ul li .display-flex span.mr1 span")

            // document.querySelectorAll('section')[3].querySelectorAll("span")[2].innerText

            await page.waitForTimeout(5000); // wait for 5 seconds
            await browser.close();
            await page.screenshot({ path: 'example.png' });
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
                uuid: title.toLocaleLowerCase().replace(/ /g,'-').replace(/[^\w\s-]/gi, ''),
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
                    await mongodb.items.updateOne({ _id: latestDataId._id, }, { $set: payload });
                } else {
                    await mongodb.items.create(payload);
                }
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