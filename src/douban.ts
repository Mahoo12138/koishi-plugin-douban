import * as cheerio from 'cheerio'

export type SearchItem = {
  id: number,
  url: string,
  title: string,
  rating: { [key: string]: string | number }
  abstract: string
}

export const headers = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
  "Connection": "keep-alive",
  "sec-ch-ua": "\"Chromium\";v=\"94\", \"Microsoft Edge\";v=\"94\", \";Not A Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?0",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edg/94.0.992.50',
};

const URL_SEARCH = (path: string) => `https://search.douban.com/${path}/subject_search?search_text=`
const URL_CONTENT = (category: string) => `https://${category}.douban.com/subject/`
export const URL_SEARCH_BOOK = URL_SEARCH('book')
export const URL_SEARCH_MUSIC = URL_SEARCH('music')
export const URL_SEARCH_MOVIE = URL_SEARCH('movie')
export const URL_CONTENT_BOOK = URL_CONTENT('book')
export const URL_CONTENT_MUSIC = URL_CONTENT('music')
export const URL_CONTENT_MOVIE = URL_CONTENT('movie')

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