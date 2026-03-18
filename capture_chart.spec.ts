import { test } from '@playwright/test';
import fs from 'fs';

test('capture stacked bar chart', async ({ page }) => {
    // 1. 대시보드 접근 (로컬 서버 5173 또는 정적 호스팅 포트 가정, 우선 Vercel/Cloudflare 배포 주소나 로컬 확인)
    // 현재 실행 중인 서버가 있는지 확실치 않아 5173으로 시도 (Vite 기본 포트)
    try {
        await page.goto('http://localhost:5173/dashboard');

        // 2. 창원사업부 (디폴트) 탭 대기
        await page.waitForSelector('text=창원사업부', { timeout: 5000 });

        // 3. 차트 컴포넌트 렌더링 대기
        await page.waitForSelector('.recharts-responsive-container', { timeout: 5000 });

        // 4. 약간 스크롤하여 차트가 잘 보이게 이동
        await page.evaluate(() => window.scrollBy(0, 300));

        // 5. 스크린샷 찰칵 📸
        await page.screenshot({ path: 'chart_capture.png', fullPage: true });
        console.log("Screenshot saved to chart_capture.png");
    } catch (e) {
        console.error("Local server might not be running or timeout occurred:", e);
    }
});
