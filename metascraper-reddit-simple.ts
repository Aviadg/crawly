import type { CheerioAPI } from "cheerio";
import type { Rules } from "metascraper";

/**
 * Simplified Reddit metascraper plugin for testing.
 * Uses DOM parsing only (no API calls to avoid dependency on fetchWithProxy).
 */

const domainFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  } catch {
    return "";
  }
};

const test = ({ url }: { url: string }): boolean =>
  domainFromUrl(url).toLowerCase() === "reddit";

const fallbackDomImage = ({ htmlDom }: { htmlDom: CheerioAPI }) => {
  // Look for preview or i.redd.it images
  const previewImages = htmlDom('img[src*="preview.redd.it"]')
    .map((_, el) => htmlDom(el).attr("src"))
    .get();
  const iImages = htmlDom('img[src*="i.redd.it"]')
    .map((_, el) => htmlDom(el).attr("src"))
    .get();
  return previewImages[0] || iImages[0];
};

const fallbackDomTitle = ({ htmlDom }: { htmlDom: CheerioAPI }) => {
  const title: string | undefined = htmlDom("shreddit-title[title]")
    .first()
    .attr("title");
  const postTitle: string | undefined =
    title ?? htmlDom("shreddit-post[post-title]").first().attr("post-title");
  return postTitle ? postTitle.trim() : undefined;
};

const REDDIT_LOGO_URL =
  "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png";

const metascraperRedditSimple = () => {
  const rules: Rules = {
    pkgName: "metascraper-reddit-simple",
    test,
    image: ({ htmlDom }) => fallbackDomImage({ htmlDom }),
    title: ({ htmlDom }) => fallbackDomTitle({ htmlDom }),
    logo: ({ url }) => (test({ url }) ? REDDIT_LOGO_URL : undefined),
    publisher: ({ url }) => (test({ url }) ? "Reddit" : undefined),
  };

  return rules;
};

export default metascraperRedditSimple;
