import { Context, template, isInteger, segment } from 'koishi'

import atemplate from 'art-template'

import {
  headers,
  parseRenderData,
  SearchItem,
  URL_CONTENT_BOOK,
  URL_CONTENT_MOVIE,
  URL_CONTENT_MUSIC,
  URL_SEARCH_BOOK,
  URL_SEARCH_MOVIE, 
  URL_SEARCH_MUSIC
} from './douban'

const decrypt = require('./decrypt.js')

export const name = 'douban'

export const using = ['puppeteer'] as const

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
    const data: SearchItem[] = result.payload.items;
    return data.filter(item => !!item.rating)
  }

  ctx.command('douban <keyword>', '使用豆瓣搜索，默认搜索电影')
    .example('douban 言叶之庭')
    .example('豆瓣 你的名字')
    .example('douban -m 叶惠美')
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

     
      if (options.film) {
        url = URL_CONTENT_MOVIE
      } else if (options.book) {
        url = URL_CONTENT_BOOK
      } else {
        url = URL_CONTENT_MUSIC
      }
      // 获取详细数据
      const item = await ctx.http.get<string>(url + data[index].id, { headers })
      const info = parseRenderData(item)
      // 填充模板
      const html = atemplate(__dirname + '/assets/template.art', {
        info,
        data: data[index]
      });
      const page = await ctx.puppeteer.page();
      await page.setContent(html)
      await page.content();
      const pic = await page.screenshot({ clip: { x: 10, y: 10, height: 325, width: 750 } })
      return segment.image(pic)
    })
}
