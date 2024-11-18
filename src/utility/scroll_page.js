function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function pagLoad(page) {
    try {
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
        return page
    } catch {
        return page
    }

}


//Get Days to Date
function getDateXDaysAgo(numOfDays, date = new Date()) {
    const newDate = new Date(date.getTime());
    newDate.setDate(date.getDate() - numOfDays);
    return newDate;
}

//Get Hours to Date
function getDateXHoursAgo(numOfHours, date = new Date()) {
    const newDate = new Date(date.getTime());
    newDate.setHours(date.getHours() - numOfHours);
    return newDate;
}

//Get Minute to Date
function getDateXMinuteAgo(numOfMinute, date = new Date()) {
    const newDate = new Date(date.getTime());
    newDate.setMinutes(date.getMinutes() - numOfMinute);
    return newDate;
}

//Get Second to Date
function getDateXSecondAgo(numOfSecond, date = new Date()) {
    const newDate = new Date(date.getTime());
    newDate.setSeconds(date.getSeconds() - numOfSecond);
    return newDate;
}


module.exports = {
    pagLoad,
    getDateXDaysAgo,
    getDateXHoursAgo,
    getDateXMinuteAgo,
    getDateXSecondAgo
}