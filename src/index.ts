import { Context, isInteger, segment, Schema } from 'koishi'
import {} from '@koishijs/plugin-puppeteer'
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


interface TemplateOptions {
  simpleTemplate?: boolean
}

export const Config = Schema.object({
  simpleTemplate: Schema.boolean().default(true).description('是否简约模板'),
})

export function apply(ctx: Context, config: TemplateOptions) {
  const parseDataFromHtml = async (url: string): Promise<SearchItem[]> => {
    if (!url) return null
    const html = await ctx.http.get(url, { headers })
    const r = /window\.__DATA__ = "(.*?)";/.exec(html)[1];
    const result = decrypt(r);
    const data: SearchItem[] = result.payload.items;
    return data.filter(item => !!item.rating)
  }

  ctx.i18n.define('zh', require('./locales/zh'))

  ctx.command('douban <keyword>', '使用豆瓣搜索')
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
        const output = [session.text('douban.has-multi-result', [keyword, 3])]
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
          return session.text('douban.incorrect-index')
        }
      } else {
        return session.text('douban.resource-not-exist', [keyword])
      }

      if (options.music) {
        url = URL_CONTENT_MUSIC
      } else if (options.book) {
        url = URL_CONTENT_BOOK
      } else {
        url = URL_CONTENT_MOVIE
      }
      // 获取详细数据
      const item = await ctx.http.get<string>(url + data[index].id, { headers })
      const info = parseRenderData(item)
      
      let templateCate = '/assets/original.art', size = [750, 325]
      if(config.simpleTemplate){
        templateCate = '/assets/simple.art',size = [320, 480]
      }
      // 填充模板
      const html = atemplate(__dirname + templateCate, {
        info,
        data: data[index]
      });
      const page = await ctx.puppeteer.page();
      await page.setContent(html)
      await page.content();
      const pic = await page.screenshot({ clip: { x: 8, y: 8, height: size[1], width: size[0] } })

      return segment.image(pic)
    })
}
