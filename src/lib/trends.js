import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000
});

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getTrends(config) {
  const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(config.signals.trendsGeo)}`;
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, 10).map((item) => ({
    topic: sanitizeText(item.title),
    link: item.link || ""
  }));
}

async function getNewsForTopic(config, topic) {
  const q = encodeURIComponent(topic);
  const url = `https://news.google.com/rss/search?q=${q}&hl=${config.signals.newsHl}&gl=${config.signals.newsGl}&ceid=${config.signals.newsCeid}`;
  const feed = await parser.parseURL(url);
  const item = (feed.items || [])[0];

  if (!item) {
    return null;
  }

  return {
    articleTitle: sanitizeText(item.title),
    articleLink: item.link || "",
    articleSnippet: sanitizeText(item.contentSnippet || item.content || item.summary || ""),
    articlePublishedAt: item.pubDate || item.isoDate || null,
    sourceKind: "news"
  };
}

function buildFallbackCandidate(config, topic) {
  return {
    articleTitle: `${topic}: what is moving right now`,
    articleLink: `https://news.google.com/search?q=${encodeURIComponent(topic)}&hl=${config.signals.newsHl}&gl=${config.signals.newsGl}&ceid=${config.signals.newsCeid}`,
    articleSnippet: `Fresh interest around ${topic}. Use a timely angle with useful context and an opinion that feels native to X.`,
    articlePublishedAt: null,
    sourceKind: "fallback"
  };
}

function scoreCandidate(candidate, priorityTopics = []) {
  const haystack = `${candidate.topic} ${candidate.articleTitle} ${candidate.articleSnippet}`.toLowerCase();
  let score = 0;

  if (candidate.sourceKind === "news") {
    score += 3;
  }
  if (candidate.articlePublishedAt) {
    const published = new Date(candidate.articlePublishedAt).getTime();
    if (Number.isFinite(published)) {
      const ageMinutes = (Date.now() - published) / 60000;
      if (ageMinutes <= 60) {
        score += 4;
      } else if (ageMinutes <= 240) {
        score += 2;
      }
    }
  }
  for (const topic of priorityTopics) {
    if (haystack.includes(String(topic).toLowerCase())) {
      score += 2;
    }
  }
  if (/\b(breaking|viral|controvers|election|launch|update|crisis|debate)\b/i.test(haystack)) {
    score += 2;
  }

  return score;
}

export async function collectTrendCandidates(config, priorityTopics = []) {
  const trendSeed = [
    ...priorityTopics.map((topic) => ({ topic, link: "" })),
    ...(await getTrends(config))
  ].filter((item, index, array) => array.findIndex((entry) => entry.topic.toLowerCase() === item.topic.toLowerCase()) === index);

  const candidates = [];
  for (const trend of trendSeed) {
    try {
      const news = await getNewsForTopic(config, trend.topic).catch(() => null);
      const payload = news || buildFallbackCandidate(config, trend.topic);
      const candidate = {
        topic: trend.topic,
        trendLink: trend.link,
        ...payload
      };
      candidate.score = scoreCandidate(candidate, priorityTopics);
      candidates.push(candidate);
    } catch (error) {
      console.warn(`[xsaas] failed to enrich trend "${trend.topic}": ${error.message}`);
    }
  }

  return candidates.sort((left, right) => (right.score || 0) - (left.score || 0));
}
