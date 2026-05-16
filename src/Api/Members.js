import * as cheerio from 'cheerio';

export default class Members {
    async list(session, chamber) {
        const listingUrl = new URL('https://www.scstatehouse.gov/member.php')
        listingUrl.searchParams.set('chamber', chamber)
        listingUrl.searchParams.set('order', 'D')
        listingUrl.searchParams.set('session', session)
        const $ = await cheerio.fromURL(listingUrl);
        const members = new Map()
        $('.member').each((_i, el) => {
            const district = Number($(el).find('.district h1 a').text().match(/District (\d+)/)[1])
            const bioUrl = new URL($(el).find('.district h1 a')[0].attribs.href, 'https://www.scstatehouse.gov')
            const photoUrl = new URL($(el).find('img.memberpic')[0].attribs.src, 'https://www.scstatehouse.gov')
            const name = $(el).find('.membername').text()
            const party = $(el).find('.info').text().match(/\(([R|D])\)/)[1]
            const code = bioUrl.searchParams.get('code')
            members.set(district, {code, district, name, party, bioUrl, photoUrl})
        });
        return members
    }

    async senators(session) {
        return await this.list(session, 'S')
    }

    async representatives(session) {
        return await this.list(session, 'H')
    }

    async detail(session, chamber, district) {
        const members = await this.list(session, chamber)
        return members.get(district)
    }

    async code(session, chamber, district) {
        const member = await this.detail(session, chamber, district)
        return Number(member.code)
    }
}
