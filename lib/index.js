"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.name = void 0;
const koishi_1 = require("koishi");
const puppeteer_1 = __importDefault(require("puppeteer"));
const decrypt = require('./decrypt.js');
exports.name = 'douban';
const URL_BASE = (path) => `https://search.douban.com/${path}/subject_search?search_text=`;
const URL_SEARCH_BOOK = URL_BASE('book');
const URL_SEARCH_MUSIC = URL_BASE('music');
const URL_SEARCH_MOVIE = URL_BASE('movie');
const URL_MOVIE_CARD = (id) => `https://movie.douban.com/subject/${id}/output_card`;
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
koishi_1.template.set('douban', {
    'resource-not-exist': '豆瓣站内暂无 “{0}” 相关资源。',
    'await-choose-result': '请发送您想查看的资源编号。',
    'error-with-link': '豆瓣搜索时出现问题。',
    'has-multi-result': '“{0}”有多个搜索结果（显示前 {1} 个）：',
    'incorrect-index': '输入选项有误。',
});
function apply(ctx) {
    const grabDataFromHtml = async (url) => {
        if (!url)
            return null;
        const data = await ctx.http.get(url, { headers });
        const r = /window\.__DATA__ = "(.*?)";/.exec(data)[1];
        const result = decrypt(r);
        return result.payload.items;
    };
    ctx.command('douban <keyword>', '使用豆瓣搜索')
        .example('豆瓣 朝花夕拾')
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
            url = URL_SEARCH_BOOK + url;
        }
        else if (options.music) {
            url = URL_SEARCH_MUSIC + url;
        }
        else {
            url = URL_SEARCH_MOVIE + url; // 默认搜索电影
        }
        const data = await grabDataFromHtml(url);
        let index = 0;
        if (data.length > 1) {
            const output = [(0, koishi_1.template)('douban.has-multi-result', keyword, 3)];
            for (let i = 0; i < 3; i++) {
                output.push(`${i + 1}. ${data[i].title}\n  ${data[i].abstract}`);
            }
            await session.send(output.join('\n'));
            const answer = await session.prompt(30 * 1000);
            if (!answer)
                return;
            index = +answer - 1;
            if (!(0, koishi_1.isInteger)(index) || index < 0 || index >= 3) {
                return (0, koishi_1.template)('douban.incorrect-index');
            }
        }
        if (options.film) {
            const browser = await puppeteer_1.default.launch();
            const page = await browser.newPage();
            await page.goto(URL_MOVIE_CARD(data[index].id));
            const pic = await page.screenshot({ clip: { x: 10, y: 10, height: 325, width: 750 } });
            return koishi_1.segment.image(pic);
        }
        // ctx.logger('douban').info(data)
    });
}
exports.apply = apply;
// {
//   id: 1292262,
//   cover_url: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p477229647.webp',
//   topics: [ [Object] ],
//   abstract_2: '赛尔乔·莱昂内 / 罗伯特·德尼罗 / 詹姆斯·伍兹 / 伊丽莎白·麦戈文 / 乔·佩西 / 波特·杨 / 塔斯黛·韦尔德 / 特里特
// ·威廉斯 / 丹尼·爱罗',
//   url: 'https://movie.douban.com/subject/1292262/',
//   interest: null,
//   extra_actions: [],
//   abstract: '美国 / 意大利 / 犯罪 / 剧情 / 四海兄弟(台) / 义薄云天(港) / 229分钟',
//   title: '美国往事 Once Upon a Time in America (1984)',
//   tpl_name: 'search_subject',
//   more_url: `onclick="moreurl(this,{i:'0',query:'%E7%BE%8E%E5%9B%BD%E5%BE%80%E4%BA%8B',subject_id:'1292262',from:'mv_subject_search',is_tv:'0'})"`,
//   label_actions: [],
//   labels: [ [Object] ],
//   rating: { star_count: 4.5, count: 373178, value: 9.2, rating_info: '' }
// }
// {
//   id: 33414086,
//   tpl_name: 'search_subject',
//   topics: [],
//   rating: { count: 2902, rating_info: '', star_count: 4.5, value: 9.4 },
//   title: '半岛铁盒',
//   url: 'https://music.douban.com/subject/33414086/',
//   more_url: `onclick="moreurl(this,{i:'0',query:'%E5%8D%8A%E5%B2%9B%E9%93%81%E7%9B%92',subject_id:'33414086',from:'music_subject_search'})"`,
//   abstract: '周杰伦 Jay Chou / 2002-07-18 / 单曲 / CD / 流行',
//   labels: [],
//   cover_url: 'https://img2.doubanio.com/view/subject/m/public/s32294843.jpg',
//   label_actions: [],
//   abstract_2: '',
//   interest: null,
//   extra_actions: []
// },
// {
//   interest: null,
//   url: 'https://book.douban.com/subject/1449352/',
//   title: '朝花夕拾',
//   abstract: '鲁迅 / 人民文学出版社 / 1973-4 / 0.25元',
//   rating: { star_count: 4.5, value: 8.9, count: 127696, rating_info: '' },
//   extra_actions: [],
//   more_url: `onclick="moreurl(this,{i:'0',query:'%E6%9C%9D%E8%8A%B1%E5%A4%95%E6%8B%BE',subject_id:'1449352',from:'book_subject_search',cat_id:'1001'})"`,
//   label_actions: [],
//   tpl_name: 'search_subject',
//   labels: [],
//   topics: [],
//   id: 1449352,
//   cover_url: 'https://img2.doubanio.com/view/subject/m/public/s2875823.jpg',
//   abstract_2: ''
// },
