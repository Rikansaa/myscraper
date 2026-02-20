// @author Rizki
// @title NanoReview
// @description see smartphone chipset rating
// @baseurl https://nanoreview.net/en/soc-list/rating
// @tags tools
// @language javascript

const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

async function Nanoreview() {
  const html = await cloudscraper.get('https://nanoreview.net/en/soc-list/rating');
  const $ = cheerio.load(html);
  const processors = [];

  $('table.table-list tbody tr').each((i, el) => {
    const tds = $(el).find('td');
    processors.push({
      rank: $(tds[0]).text().trim(),
      name: $(tds[1]).find('a').text().trim(),
      manufacturer: $(tds[1]).find('.text-gray-small').text().trim(),
      rating: $(tds[2]).text().trim().replace(/\n/g, ' '),
      antutu: $(tds[3]).text().trim(),
      geekbench: $(tds[4]).text().trim(),
      cores: $(tds[5]).text().trim().replace(/\n/g, ''),
      clock: $(tds[6]).text().trim(),
      gpu: $(tds[7]).text().trim()
    });
  });

  return processors;
}

(async () => {
  const results = await Nanoreview();
  console.log(results);
})();