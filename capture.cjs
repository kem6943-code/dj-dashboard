const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:5174/dashboard');
        await page.waitForSelector('text=창원사업부', { timeout: 10000 });

        // 차트가 렌더링될 시간 부여
        await page.waitForTimeout(2000);

        // 약간 스크롤
        await page.evaluate(() => window.scrollBy(0, 400));

        // 스크린샷 찰칵 
        await page.screenshot({ path: 'chart_capture.png', fullPage: true });
        console.log("Screenshot saved to chart_capture.png");
    } catch (error) {
        console.error("Error capturing chart:", error);
    } finally {
        await browser.close();
    }
})();
