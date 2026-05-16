import * as cheerio from 'cheerio';
import {zipObject} from 'lodash-es';
import {TZDate} from '@date-fns/tz';

export default class Votes {
    async list(session, chamber, memberCode) {
        const res = await fetch('https://www.scstatehouse.gov/votehistory.php', {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                type: 'SPONSOR',
                chamber,
                session,
                sponsor: memberCode,
                headerfooter: 0,
                votetype: 2, // roll call
                howvoted: 'Y'
            })
        })
        const html = await res.text()
        const $ = cheerio.load(html);

        const table = []
        const headers = []
        $('tr').each((_i, el) => {
            if (_i === 0) {
                $(el).find('th').each((_j, el2) => {
                    headers.push($(el2).text())
                })
            } else {
                const cells = []
                $(el).find('td').each((_j, el2) => {
                    let value = $(el2).text()
                    switch (_j) {
                        case 0: // Vote#
                            value = {
                                id: value,
                                url: new URL(
                                    $(el2).find('a').attr('href'),
                                    'https://www.scstatehouse.gov'
                                ).toString()
                            };
                            break;
                        case 1: // Bill#
                            value = this.#normalizeBillNumber(value);
                            break;
                        case 2: // Summary/Motion
                            const contents = $(el2).contents();
                            value = {
                                description: contents.eq(0).text().replaceAll(/[\(\)]/g, ''),
                                motion: contents.eq(2).text().trim()
                                    .replace(/^to /, '')
                                    .replace(/^adopt/, 'Adopt')
                                    .replace(/^lay on the table/, 'Table')
                                    .replace(/\s+/g, ' ')
                                    .replaceAll(' number ', ' #'),
                            };
                            if (contents.eq(2).find('a').length > 0) {
                                const matches = value.motion.match(/([A-Z0-9-]+)$/);
                                value.amendment = {
                                    number: matches
                                        ? matches[0]
                                        : contents.eq(2).find('a').text().trim(),
                                    url: new URL(
                                        contents.eq(2).find('a').attr('href'),
                                        'https://scstatehouse.gov'
                                    ).toString()
                                };
                            }
                            break;
                        case 3: // Date/Time
                            value = this.#normalizeDateTime(value);
                            break;
                    }
                    cells.push(value)
                })
                table.push(zipObject(headers, cells))
            }
        });

        return table.map(row => ({
            id: row['Vote#'].id,
            timestamp: row['Date/Time'],
            voteUrl: row['Vote#'].url,
            bill: row['Bill#'],
            billDescription: row['Summary/Motion']?.description,
            billUrl: row['Bill#']
                ? `https://www.scstatehouse.gov/billsearch.php?billnumbers=${row['Bill#'].split('.')[1]}&session=${session}&headerfooter=0`
                : null,
            amendment: row['Summary/Motion']?.amendment?.number,
            amendmentUrl: row['Summary/Motion']?.amendment?.url,
            question: row['Summary/Motion']?.motion,
            vote: row['Vote'],
            result: row['Result'],
            // ayes: Number(row['Ayes']),
            // nays: Number(row['Nays']),
            // nvs: Number(row['N/V']),
            // excused: Number(row['Exc.Abs.']),
            // present: Number(row['Pres.']),
            // abstentions: Number(row['Abstain/Recused']),
            // total: Number(row['Total']),
        }))
    }

    #normalizeBillNumber(bill) {
        const matches = String(bill).match(/(H|S) (\d+)/)
        if (matches) {
            const chamber = matches[1]
            const num = Number(matches[2])
            return `${chamber}.${num}`
        }
        return bill
    }

    #normalizeDateTime(dateTime) {
        return new TZDate(dateTime, 'America/New_York')
    }
}

// console.log(await new Votes().list(126, 'H', 88636353))
