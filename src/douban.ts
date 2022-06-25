import * as cheerio from 'cheerio'

export const parseRenderData = (html: string) => {
  const $ = cheerio.load(html);
  const card = $(".subjectwrap")

  const base = card.find("#info").text().split('\n').map(item => item.trim())
  const rating = card.find(".rating_per").map(function (i, el) {
    return $(this).text();
  }).get().map(p => p.replace('%', ''))

  for (let i = base.length - 1; i >= 0; i--) {
    if (base[i].length == 0) {
      base.splice(i, 1);
    }
  }
  return {
    base,
    rating,
  }
}