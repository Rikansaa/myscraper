// @author Rizki
// @title KBBI
// @description search for words
// @baseurl https://kbbi.web.id
// @tags search
// @language javascript

const axios = require('axios');
const cheerio = require('cheerio');

async function kbbi(kata) {
  const { data } = await axios.get(`https://kbbi.web.id/${encodeURIComponent(kata)}`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
    }
  });
  
  const $ = cheerio.load(data);
  return $('#d1').text().trim() || null;
}

(async () => {
  const result = await kbbi('gadget');
  console.log(result);
})();