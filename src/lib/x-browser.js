import { chromium } from "playwright";

import { decryptSecret } from "./crypto.js";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseStorageState(encoded) {
  if (!encoded) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(String(encoded), "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

async function encodeStorageState(context) {
  const state = await context.storageState();
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64");
}

function parseAccountIdFromCookies(cookies = []) {
  const twidCookie = cookies.find((cookie) => cookie.name === "twid");
  const value = String(twidCookie?.value || "");
  const match = value.match(/u=(\d+)/i);
  return match?.[1] || "";
}

async function clickIfVisible(page, selector) {
  const node = page.locator(selector).first();
  if (await node.count().catch(() => 0)) {
    await node.click({ timeout: 7000, force: true }).catch(() => {});
    return true;
  }

  return false;
}

async function dismissBlockingLayers(page) {
  await page.keyboard.press("Escape").catch(() => {});

  await clickIfVisible(page, 'button:has-text("Got it")');
  await clickIfVisible(page, 'button:has-text("Accept")');
  await clickIfVisible(page, 'button:has-text("Aceptar")');
  await clickIfVisible(page, 'button:has-text("Close")');
  await clickIfVisible(page, 'button:has-text("Cerrar")');

  const layers = [
    '[data-testid="twc-cc-mask"]',
    '[data-testid="mask"]',
    '#layers [role="dialog"]',
    '#layers [data-testid="sheetDialog"]'
  ];

  for (const selector of layers) {
    const node = page.locator(selector).first();
    if (await node.count().catch(() => 0)) {
      await node.evaluate((element) => element.remove()).catch(() => {});
    }
  }
}

async function createBrowserContext(config, { headed = false, storageState } = {}) {
  const browser = await chromium.launch({
    headless: headed ? false : config.x.headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-features=IsolateOrigins,site-per-process",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  const context = await browser.newContext({
    storageState,
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1440, height: 1024 },
    locale: "en-US",
    timezoneId: "America/New_York",
    colorScheme: "light"
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined
    });
    window.chrome = window.chrome || { runtime: {} };
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5]
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"]
    });
  });

  const page = await context.newPage();
  return { browser, context, page, config };
}

async function getProfilePath(page) {
  const profileLink = page.locator('[data-testid="AppTabBar_Profile_Link"]').first();
  const href = await profileLink.getAttribute("href").catch(() => null);
  return href || null;
}

async function extractTweetUrl(tweet) {
  const links = tweet.locator('a[href*="/status/"]');
  const count = await links.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href").catch(() => "");
    if (href && href.includes("/status/")) {
      return href.startsWith("http") ? href : `https://x.com${href}`;
    }
  }

  return "";
}

export function extractStatusId(url) {
  const match = String(url || "").match(/status\/(\d+)/i);
  return match?.[1] || "";
}

export function buildXPostUrl(username, postId) {
  if (!username || !postId) {
    return "";
  }

  return `https://x.com/${String(username).replace(/^@/, "")}/status/${postId}`;
}

export function normalizeXErrorMessage(error) {
  const raw = String(error instanceof Error ? error.message : error || "").trim();
  if (!raw) {
    return "X rejected the request.";
  }

  if (/session expired|connect the account again|missing stored browser session/i.test(raw)) {
    return "The saved X session expired. Connect the account again.";
  }

  if (/closed before login/i.test(raw)) {
    return "The X login window was closed before the session could be saved.";
  }

  if (/timed out waiting for x home timeline|timed out waiting for login/i.test(raw)) {
    return "X login took too long. Start the connection again and finish the login in the browser window.";
  }

  if (/duplicate/i.test(raw)) {
    return "X rejected the post because the content looks duplicated.";
  }

  return raw;
}

export async function isLoggedIn(page, baseUrl = "https://x.com") {
  await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await dismissBlockingLayers(page);
  return page.url().includes("/home");
}

export async function createManualLoginSession(config) {
  const session = await createBrowserContext(config, { headed: true });
  await session.page.goto(`${config.x.baseUrl}/i/flow/login`, { waitUntil: "domcontentloaded" });
  await session.page.waitForTimeout(1500);

  return {
    ...session,
    async persistStorageState() {
      return encodeStorageState(session.context);
    }
  };
}

export async function readConnectedAccountProfile(session) {
  const { page, context } = session;
  const baseUrl = session.config?.x?.baseUrl || "https://x.com";

  await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(1500);
  await dismissBlockingLayers(page);

  const profilePath = await getProfilePath(page);
  if (!profilePath) {
    throw new Error("Could not resolve the logged-in X profile.");
  }

  const username = String(profilePath || "")
    .replace(/^\/+/, "")
    .split("/")[0]
    .trim()
    .toLowerCase();

  if (!username) {
    throw new Error("Could not resolve the logged-in X handle.");
  }

  await page.goto(`${baseUrl}/${username}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(2000);
  await dismissBlockingLayers(page);

  const texts = await page.locator('[data-testid="UserName"] span').allTextContents().catch(() => []);
  const displayName =
    texts
      .map((value) => String(value || "").trim())
      .find((value) => value && !value.startsWith("@") && !value.includes("·")) || username;

  const cookies = await context.cookies();
  const accountId = parseAccountIdFromCookies(cookies) || username;

  return {
    accountId,
    username,
    displayName,
    profile: {
      username,
      displayName,
      connectionMode: "browser_session"
    }
  };
}

export async function waitForManualLogin(session, { timeoutMs = 15 * 60 * 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const baseUrl = session.config?.x?.baseUrl || "https://x.com";

  while (Date.now() < deadline) {
    if (session.page.isClosed()) {
      throw new Error("The X login window was closed before login finished.");
    }

    if (await isLoggedIn(session.page, baseUrl)) {
      const storageStateB64 = await session.persistStorageState();
      const profile = await readConnectedAccountProfile(session);
      return {
        storageStateB64,
        profile
      };
    }

    await sleep(1000);
  }

  throw new Error("Timed out waiting for X home timeline. Login was not completed in time.");
}

export async function openStoredBrowserSession(config, xAccount, { headed = false } = {}) {
  const encodedState = decryptSecret(xAccount?.storageStateEnc, config.encryptionSecret);
  const storageState = parseStorageState(encodedState);
  if (!storageState) {
    throw new Error("Missing stored browser session for this X account.");
  }

  const session = await createBrowserContext(config, { headed, storageState });
  const loggedIn = await isLoggedIn(session.page, config.x.baseUrl);
  if (!loggedIn) {
    await closeXSession(session);
    throw new Error("The saved X session expired. Connect the account again.");
  }

  return {
    ...session,
    async persistStorageState() {
      return encodeStorageState(session.context);
    }
  };
}

async function fillComposer(page, text) {
  const selectors = [
    '[data-testid="tweetTextarea_0"]',
    '[data-testid="tweetTextarea_0RichTextInput"]',
    'div[role="textbox"][data-testid*="tweetTextarea"]',
    'div[role="textbox"]'
  ];

  for (const selector of selectors) {
    const editor = page.locator(selector).first();
    if (!(await editor.count().catch(() => 0))) {
      continue;
    }

    await editor.click({ timeout: 15000, force: true }).catch(() => {});
    await editor.fill(text, { timeout: 15000 }).catch(async () => {
      await editor.evaluate((element, value) => {
        element.focus();
        element.textContent = value;
        element.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      }, text);
    });

    return true;
  }

  return false;
}

async function submitComposer(page) {
  await dismissBlockingLayers(page);

  const selectors = [
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    'button:has-text("Post")',
    'button:has-text("Publicar")'
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).last();
    if (!(await button.count().catch(() => 0))) {
      continue;
    }

    const disabled = await button.isDisabled().catch(() => false);
    if (disabled) {
      continue;
    }

    await button.click({ timeout: 15000, force: true }).catch(() => {});
    return true;
  }

  await page.keyboard.press(process.platform === "win32" ? "Control+Enter" : "Meta+Enter").catch(() => {});
  await page.waitForTimeout(1000);
  return true;
}

async function verifyLatestPostedTweet(session, expectedText) {
  const { page } = session;
  const baseUrl = session.config?.x?.baseUrl || "https://x.com";

  await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(1500);
  await dismissBlockingLayers(page);

  const profilePath = await getProfilePath(page);
  if (!profilePath) {
    return null;
  }

  await page.goto(`${baseUrl}${profilePath}`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(2500);
  await dismissBlockingLayers(page);

  const firstTweet = page.locator('[data-testid="tweet"]').first();
  const tweetUrl = await extractTweetUrl(firstTweet);
  const tweetText = await firstTweet.locator('[data-testid="tweetText"]').first().innerText().catch(() => "");

  if (!tweetUrl) {
    return null;
  }

  return {
    tweetUrl,
    visibleText: tweetText,
    matchedExpectedText: String(tweetText).toLowerCase().includes(String(expectedText).slice(0, 40).toLowerCase())
  };
}

export async function postTweet(session, { text, imagePath = "" }) {
  const { page } = session;

  await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(2500);
  await dismissBlockingLayers(page);

  const editorFilled = await fillComposer(page, text);
  if (!editorFilled) {
    throw new Error("Could not find the X composer.");
  }

  if (imagePath) {
    const fileInput = page.locator('input[data-testid="fileInput"], input[type="file"]').first();
    if (await fileInput.count().catch(() => 0)) {
      await fileInput.setInputFiles(imagePath).catch(() => {});
      await page.waitForTimeout(4000);
    }
  }

  await submitComposer(page);
  await page.waitForTimeout(5000);

  const verification = await verifyLatestPostedTweet(session, text);
  if (!verification?.tweetUrl) {
    throw new Error("X did not confirm the new post in the profile timeline.");
  }

  return verification;
}

export async function publishTextPost(config, xAccount, { text, imagePath = "" } = {}) {
  const session = await openStoredBrowserSession(config, xAccount);

  try {
    const verification = await postTweet(session, { text, imagePath });
    const refreshedStorageStateB64 = await session.persistStorageState().catch(() => "");
    const postId = extractStatusId(verification?.tweetUrl);

    return {
      postId,
      postUrl: verification?.tweetUrl || buildXPostUrl(xAccount.username, postId),
      storageStateB64: refreshedStorageStateB64,
      verification
    };
  } finally {
    await closeXSession(session);
  }
}

export async function closeXSession(session) {
  await session?.context?.close().catch(() => {});
  await session?.browser?.close().catch(() => {});
}
