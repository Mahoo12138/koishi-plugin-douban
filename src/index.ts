import { Context, template, isInteger, segment } from 'koishi'

import atemplate from 'art-template'

import { parseRenderData } from './douban'
const decrypt = require('./decrypt.js')


export const name = 'douban'

export const using = ['puppeteer'] as const



const URL_BASE = (path: string) => `https://search.douban.com/${path}/subject_search?search_text=`
const URL_SEARCH_BOOK = URL_BASE('book')
const URL_SEARCH_MUSIC = URL_BASE('music')
const URL_SEARCH_MOVIE = URL_BASE('movie')

type SearchItem = {
  id: number,
  url: string,
  title: string,
  rating: {[key:string]:string|number}
  abstract: string
}

const headers = {
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

template.set('douban', {
  'resource-not-exist': '豆瓣站内暂无 “{0}” 相关资源。',
  'await-choose-result': '请发送您想查看的资源编号。',
  'error-with-link': '豆瓣搜索时出现问题。',
  'has-multi-result': '“{0}”有多个搜索结果（显示前 {1} 个）：',
  'incorrect-index': '输入选项有误。',
})

export function apply(ctx: Context) {
  const parseDataFromHtml = async (url: string): Promise<SearchItem[]> => {
    if (!url) return null
    const html = await ctx.http.get(url, { headers })
    const r = /window\.__DATA__ = "(.*?)";/.exec(html)[1];
    const result = decrypt(r);
    const data:SearchItem[] =  result.payload.items;
    return data.filter(item => !!item.rating)
  }

  ctx.command('douban <keyword>', '使用豆瓣搜索，默认搜索电影')
    .example('豆瓣 你的名字')
    .example('豆瓣书籍 朝花夕拾')
    .option('book', '-b')    // 搜索书籍
    .option('film', '-f')    // 搜索电影
    .option('music', '-m')    // 搜索音乐
    .shortcut('豆瓣', { fuzzy: true, options: { film: true } })
    .shortcut('豆瓣书籍', { fuzzy: true, options: { book: true } })
    .shortcut('豆瓣音乐', { fuzzy: true, options: { music: true } })
    .shortcut('豆瓣电影', { fuzzy: true, options: { film: true } })
    .action(async ({ session, options }, keyword) => {
      if (!keyword) return session.execute('douban -h')
      let url = encodeURI(keyword)
      if (options.book) {
        url = URL_SEARCH_BOOK + url
      } else if (options.music) {
        url = URL_SEARCH_MUSIC + url
      } else {
        url = URL_SEARCH_MOVIE + url  // 默认搜索电影
      }
      // 获取搜索的内容数据
      const data = await parseDataFromHtml(url)
      console.log(data)
      let index = 0
      if (data.length > 1) {
        const output = [template('douban.has-multi-result', keyword, 3)]
        for (let i = 0; i < 3; i++) {
          output.push(`${i + 1}. ${data[i].title}\n  ${data[i].abstract}`)
        }
        await session.send(output.join('\n'))
        // 等待用户选择
        const answer = await session.prompt(30 * 1000)

        if (!answer) return
        index = +answer - 1
        // 输入非法内容
        if (!isInteger(index) || index < 0 || index >= 3) {
          return template('douban.incorrect-index')
        }
      }
      
      let info = {}, html:string;
      if (options.film) {
        const movie = await ctx.http.get<string>(`https://movie.douban.com/subject/` + data[index].id, { headers })
        info = parseRenderData(movie)
        html = atemplate(__dirname + '/assets/film.art', {
          info,
          data: data[index]
        });
      } else if (options.book) {
        // const book = await ctx.http.get(`https://book.douban.com/subject/` + data[index].id, { headers })
        // console.log(book)

      } else {

      }
      const page = await ctx.puppeteer.page();
      await page.setContent(html)
      await page.content();
      const pic = await page.screenshot({ clip: { x: 10, y: 10, height: 325, width: 750 } })
      return segment.image(pic)
    })
}
