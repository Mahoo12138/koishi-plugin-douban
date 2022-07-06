"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.using = exports.name = void 0;
const koishi_1 = require("koishi");
const art_template_1 = __importDefault(require("art-template"));
const douban_1 = require("./douban");
const decrypt = require('./decrypt.js');
exports.name = 'douban';
exports.using = ['puppeteer'];
koishi_1.template.set('douban', {
    'resource-not-exist': '豆瓣站内暂无 “{0}” 相关资源。',
    'await-choose-result': '请发送您想查看的资源编号。',
    'error-with-link': '豆瓣搜索时出现问题。',
    'has-multi-result': '“{0}”有多个搜索结果（显示前 {1} 个）：',
    'incorrect-index': '输入选项有误。',
});
exports.Config = koishi_1.Schema.object({
    simple: koishi_1.Schema.boolean().default(true).description('是否简约模板'),
});
function apply(ctx, config) {
    const parseDataFromHtml = async (url) => {
        if (!url)
            return null;
        const html = await ctx.http.get(url, { headers: douban_1.headers });
        const r = /window\.__DATA__ = "(.*?)";/.exec(html)[1];
        const result = decrypt(r);
        const data = result.payload.items;
        return data.filter(item => !!item.rating);
    };
    ctx.command('douban <keyword>', '使用豆瓣搜索')
        .example('douban 言叶之庭')
        .example('豆瓣 你的名字')
        .example('douban -m 叶惠美')
        .example('豆瓣书籍 朝花夕拾')
        .option('book', '-b') // 搜索书籍
        .option('film', '-f') // 搜索电影
        .option('music', '-m') // 搜索音乐
        .shortcut('豆瓣', { fuzzy: true, options: { film: true } })
        .shortcut('豆瓣书籍', { fuzzy: true, options: { book: true } })
        .shortcut('豆瓣音乐', { fuzzy: true, options: { music: true } })
        .shortcut('豆瓣电影', { fuzzy: true, options: { film: true } })
        .action(async ({ session, options }, keyword) => {
        if (!keyword)
            return session.execute('douban -h');
        let url = encodeURI(keyword);
        if (options.book) {
            url = douban_1.URL_SEARCH_BOOK + url;
        }
        else if (options.music) {
            url = douban_1.URL_SEARCH_MUSIC + url;
        }
        else {
            url = douban_1.URL_SEARCH_MOVIE + url; // 默认搜索电影
        }
        // 获取搜索的内容数据
        const data = await parseDataFromHtml(url);
        let index = 0;
        if (data.length > 1) {
            const output = [(0, koishi_1.template)('douban.has-multi-result', keyword, 3)];
            for (let i = 0; i < 3; i++) {
                output.push(`${i + 1}. ${data[i].title}\n  ${data[i].abstract}`);
            }
            await session.send(output.join('\n'));
            // 等待用户选择
            const answer = await session.prompt(30 * 1000);
            if (!answer)
                return;
            index = +answer - 1;
            // 输入非法内容
            if (!(0, koishi_1.isInteger)(index) || index < 0 || index >= 3) {
                return (0, koishi_1.template)('douban.incorrect-index');
            }
        }
        if (options.music) {
            url = douban_1.URL_CONTENT_MUSIC;
        }
        else if (options.book) {
            url = douban_1.URL_CONTENT_BOOK;
        }
        else {
            url = douban_1.URL_CONTENT_MOVIE;
        }
        // 获取详细数据
        const item = await ctx.http.get(url + data[index].id, { headers: douban_1.headers });
        const info = (0, douban_1.parseRenderData)(item);
        let templateCate = '/assets/original.art', size = [750, 325];
        if (config.simpleTemplate) {
            templateCate = '/assets/simple.art', size = [320, 480];
        }
        // 填充模板
        const html = (0, art_template_1.default)(__dirname + templateCate, {
            info,
            data: data[index]
        });
        const page = await ctx.puppeteer.page();
        await page.setContent(html);
        await page.content();
        const pic = await page.screenshot({ clip: { x: 8, y: 8, height: size[1], width: size[0] } });
        return koishi_1.segment.image(pic);
    });
}
exports.apply = apply;
