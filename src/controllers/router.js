import cron from 'node-cron';
import { CronJob } from 'cron';
import fs from 'fs';
import path from 'path';
import request from 'request';
import mongodb from '../models/mongodb';
import crawl_cnbc from './cnbc/router';

// Import Controller
import crawl_kiplinger from './kiplinger/router';
import crawl_yahoo from './yahoo/router';
import crawl_stocknews from './stocknews/router';
import crawl_marketwatch from './marketwatch/router';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import { resolve } from 'dns';


async function localfunction(isCron) {
    try {

        //Latest News
        await crawl_marketwatch.latestArticle();
        await deleteDuplicateRecodes('latest_news', 'marketwatch')
        // News Menu
        await crawl_yahoo.getYahooNews();
        await crawl_cnbc.getNews()

        await deleteDuplicateRecodes('top_news', 'yahoo')

        // Investing News
        await crawl_kiplinger.getNews();
        await deleteDuplicateRecodes('investing_news', 'kiplinger',)
        //Stock News
        await crawl_stocknews.getMainArticle();
        await deleteDuplicateRecodes('stock_news', 'stocknews')

        //Stock News
        await crawl_marketwatch.getMainArticle();
        await deleteDuplicateRecodes('main_article_news', 'marketwatch')
        await deleteDuplicateRecodes('latest_news', 'marketwatch')


        console.log("All sync completed.")
        console.log('You will see this message every second');

        if (isCron) {
            var currentTime = new Date();

            var currentOffset = currentTime.getTimezoneOffset();

            var ISTOffset = 330;   // IST offset UTC +5:30 

            var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);

            // ISTTime now represents the time in IST coordinates

            var hoursIST = ISTTime.getHours()
            var minutesIST = ISTTime.getMinutes()
            console.log("Last Time", `${hoursIST} : ${minutesIST}`);
        }

    } catch (err) {
        console.log("Error=> ", err.message)
    }
}

if (process.env.NODE_ENV == "Production") {
    console.log("Start Cron Job....");
    //0 */3 * * * Every Three hours
    //* * * * * Every Minute
    var job1 = new CronJob('0 */6 * * *',
        async function () {
            try {
                localfunction(true)
            } catch (err) {
                console.log("Error=> ", err.message)
            }
        },
        null,
        true,
        'America/Los_Angeles'
    );

    var job2 = new CronJob('0 */3 * * *',
        async function () {
            try {
                await crawl_marketwatch.latestArticle();
                console.log("Start sync completed.")
                await crawl_kiplinger.getLatesArticleNews();
                await crawl_kiplinger.getNews();
                await crawl_yahoo.getYahooNews();
                await crawl_kiplinger.getMainArticle();
                await crawl_stocknews.getMainArticle();
                await deleteDuplicateRecodes()
                console.log("All sync completed.")
                console.log('You will see this message every second');
            } catch (err) {
                console.log("Error=> ", err.message)
            }
        },
        null,
        true,
        'America/Los_Angeles'
    );

    //job1.start();
    // job2.start();
}

const main = (app) => {

    app.get("/api/get-dashboard-news", async (req, res) => {
        try {
            //const main_article = await mongodb.items.findOne({ groupType: 'main_article_news', type: 'kiplinger' });
            //  const latest_news = await mongodb.items.find({ groupType: 'latest_news', type: 'kiplinger' }).limit(10).sort({ _id: -1 });;
            const market_watch_main_article = await mongodb.items.findOne({ groupType: 'main_article_news', type: 'marketwatch' });
            const market_watch_latest_article = await mongodb.items.find({ groupType: 'latest_news', type: 'marketwatch' }).limit(10).sort({ _id: -1 });


            const distinct_market_watch_latest_article = market_watch_latest_article
            res.json({
                status: true,
                data: {
                    //main_article: main_article,
                    market_watch_main_article,
                    market_watch_latest_article: distinct_market_watch_latest_article,
                    latest_news: []
                }
            });
        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    })

    app.post("/api/get-finance-news-v3", async (req, res) => {
        try {
            const limit = req.body.limit || 10;
            const page = req.body.page || 1;
            const query = {
                groupType: 'top_news',
                type: 'yahoo'
            };
            const tempData = await mongodb.items.find(query).sort({ _id: -1 }).skip(((page * limit) - limit)).limit(limit);
            const count = await mongodb.items.count(query)
            res.json({ page_recodes: tempData.length, total_recodes: count, data: tempData });
        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.post("/api/get-search-record", async (req, res) => {
        try {
            const limit = req.body.limit || 10;
            const page = req.body.page || 1;
            let searchQuery = {};
            if (req.body.search && req.body.search) {
                searchQuery = { "title": { "$regex": req.body.search, "$options": "i" } }
            }
            const query = { $or: [{ ...searchQuery }] };
            const tempData = await mongodb.items.find(query).sort({ _id: -1 }).skip(((page * limit) - limit)).limit(limit);
            const count = await mongodb.items.count(query)
            res.json({ page_recodes: tempData.length, total_recodes: count, data: tempData });
        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.post("/api/delete-search-record", async (req, res) => {
        try {
            const tempData = await mongodb.items.distinct("link")
            tempData.forEach(async (num) => {
                var i = 0;
                const numdata = await mongodb.items.find({ link: num })
                numdata.forEach(async (doc) => {
                    if (i) await mongodb.items.remove({ link: num }, { justOne: true })
                    i++
                })
            });
            res.json({ page_recodes: tempData });
        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.post("/api/get-investing", async (req, res) => {
        try {
            const limit = req.body.limit || 10;
            const page = req.body.page || 1;
            let searchQuery = {};
            const query = {
                groupType: 'investing_news',
                type: 'kiplinger'
            };
            const tempData = await mongodb.items.find(query).sort({ updatedAt: -1 }).skip(((page * limit) - limit)).limit(limit);
            const count = await mongodb.items.count(query)
            res.json({ page_recodes: tempData.length, total_recodes: count, data: tempData });

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.post("/api/get-stock-news", async (req, res) => {
        try {
            const limit = req.body.limit || 10;
            const page = req.body.page || 1;
            const query = {
                groupType: 'stock_news',
                type: 'stocknews'
            };
            const tempData = await mongodb.items.find(query).sort({ updatedAt: -1 }).skip(((page * limit) - limit)).limit(limit);
            const count = await mongodb.items.count(query)
            res.json({ page_recodes: tempData.length, total_recodes: count, data: tempData });

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.get("/api/sync-all-news", async (req, res) => {
        try {

            localfunction();
            res.json({ status: true, message: "sysnc start....." })


        } catch (err) {
            console.log(err)
            res.json({ status: false, message: err.message });
        }
    });

    app.get("/api/restore-story", async (req, res) => {
        try {
            res.json({ status: true, message: "sysnc start....." })
            const query = {
                groupType: 'stock_news',
                type: 'stocknews'
            };
            const tempData = await mongodb.items.remove(query)
            await crawl_stocknews.getMainArticle();
        } catch (err) {
            console.log(err)
            res.json({ status: false, message: err.message });
        }
    });

    app.post("/api/send-contactus", async (req, res) => {
        try {
            const output = `
            <p>You have a new contact request</p>
            <h3>Contact Details</h3>
            <ul>  
              <li>Requester Name: ${req.body.name}</li>
              <li>Email: ${req.body.email}</li>
              <li>Message: ${req.body.message}</li>
            </ul>
            <h3>Content Message</h3>
            <p>${req.body.message}</p>
          `;

            var mailOptions = {
                from: `${process.env.SMTP_FROM}`,
                to: "contact@marketwealthadvisor.com",
                subject: "Contact US Market Wealth Advisor ",
                html: output,
            };

            const payload_config = {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE ? (process.env.SMTP_SECURE == "false" ? false : true) : false,
                auth: {
                    user: process.env.SMTP_USER_Name,
                    pass: process.env.SMTP_PASSWORD,
                }
            }

            console.log(mailOptions)
            console.log(payload_config);
            const Transport = nodemailer.createTransport(payload_config)

            Transport.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    res.send("Email Failed");
                } else {
                    console.log('Email sent: ' + info.response);
                    res.send("Email Sent");
                }
            });

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.get("/api/get-news-details/:news_id", async (req, res) => {
        try {
            const query = { _id: req.params.news_id };
            const tempData = await mongodb.items.findOne(query)
            res.json({ status: true, data: tempData });

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.get("/api/update-uuid/", async (req, res) => {
        try {
            let itemData = await mongodb.items.count();
            let count = 0;
            while (itemData < count) {
                const list = await mongodb.items.findOne({ uuid: null }).select('title');
                if (list) {
                    const title = list.title.toLocaleLowerCase().replace(/ /g, '-').replace(/[`~!@#$%^&*()_|+\=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                    let itemDatanew = await mongodb.items.count({ uuid: null });
                    await mongodb.items.updateOne({ _id: list._id }, { uuid: title });
                }
                count++
            }
            res.json({ status: true });
        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    app.get("/api/get-stort/:uuid", async (req, res) => {
        try {
            const data = await mongodb.items.findOne({ uuid: req.params.uuid })
            if (data) {
                res.json({ status: true, data: data });
            } else {
                res.json({ status: true });
            }

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });

    const GetEmailTemplete = async (reqData) => {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, '..', './templates', reqData.filename), 'utf8', (err, htmlBody) => {
                if (err) resolve(false);
                resolve(htmlBody);
            });
        });
    }

    app.get("/api/send-Subscribe/:email", async (req, res) => {
        try {
            var options = {
                'method': 'POST',
                'url': 'https://api-us1.chd01.com/accounts/2390/forms/1/subscribe/1ad41de67717a4eb70f8795b5ddc683fbf880fc5',
                'formData': {
                    'contact_fields[email]': req.params.email,
                    'commit': 'Subscribe'
                }
            };
            request(options, async function (error, response) {
                if (error) throw new Error(error);


                var mailOptions = {
                    from: `Market Wealth Advisor <${process.env.SMTP_FROM}>`,
                    to: req.params.email,
                    subject: "Thanks for subscribing!",
                    html: await GetEmailTemplete({ filename: 'subscribing.html' })
                };

                const payload_config = {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE ? (process.env.SMTP_SECURE == "false" ? false : true) : false,
                    auth: {
                        user: process.env.SMTP_USER_Name,
                        pass: process.env.SMTP_PASSWORD,
                    }
                }

                console.log(mailOptions)
                console.log(payload_config);
                const Transport = nodemailer.createTransport(payload_config)

                Transport.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        res.json({ status: false });
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.json({ status: true });
                    }
                });
            });

        } catch (err) {
            res.json({ status: false, message: err.message });
        }
    });



    // app.get('*.js', function (req, res, next) {
    //     req.url = req.url + '.gz';
    //     res.set('Content-Encoding', 'gzip');
    //     next();
    // });

    // app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "..", "..", 'build', 'index.html')));

}

const deleteDuplicateRecodes = async (groupType, type) => {
    try {
        return new Promise(async (resolve, reject) => {
            const duplicates = await mongodb.items.aggregate([
                {
                    $match: {
                        groupType: groupType,
                        type: type
                    }
                },
                {
                    $group: {
                        _id: "$uuid",  // Replace "uuid" with your actual field name
                        count: { $sum: 1 },
                        docs: { $push: "$_id" }  // Collect the document IDs
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                }
            ])

            duplicates.forEach(async duplicate => {
                // Skip the first document (keep it) and remove the rest
                const docIdsToRemove = duplicate.docs.slice(1); // Select all but the first ID
                console.log(docIdsToRemove);

                await mongodb.items.deleteMany({ _id: { $in: docIdsToRemove } });
            });
            resolve(true)

        })
    } catch (err) {
        resolve(true)
    }
}

localfunction();


module.exports = main