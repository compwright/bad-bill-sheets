import * as cheerio from 'cheerio';

export default class Sessions {
    async list() {
        const $ = await cheerio.fromURL('https://www.scstatehouse.gov/member.php?chamber=S&order=D');
        const re = /\((\d+) - (\d+)\)/
        const sessions = new Map()
        $('#sessionform_session option').each((_i, el) => {
            const matches = $(el).text().match(re)
            if (matches) {
                const number = el.attribs.value
                const years = `${matches[1]}-${matches[2]}`
                sessions.set(number, years)
            }
        });
        return sessions
    }

    async current() {
        const list = await this.list()
        const [key, value] = Array.from(list.entries())[0]
        return Number(key)
    }

    async year(session) {
        const list = await this.list()
        return list.get(String(session))
    }
}
