import * as cheerio from 'cheerio';

export default class Bills {
    async sponsors(session, bill) {
        const billNumber = Number(bill.split('.').pop())

        const $ = await cheerio.fromURL(`https://www.scstatehouse.gov/billsearch.php?billnumbers=${billNumber}&session=${session}&headerfooter=0`);

        let sponsor;
        const cosponsors = [];

        //console.log($('.bill-list-item').contents());
        $('#resultsbox .bill-list-item a[href^="/member.php"]').each((_i, el) => {
            const url = new URL(
                $(el).attr('href'),
                'https://scstatehouse.gov'
            );

            const member = {
                chamber: url.searchParams.get('chamber'),
                code: Number(url.searchParams.get('code')),
                name: $(el).text(),
                url: url.toString()
            }

            if (_i === 0) {
                sponsor = member
            } else {
                cosponsors.push(member)
            }
        });

        return {sponsor, cosponsors};
    }
}
