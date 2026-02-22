// @author Rizki
// @title SoundCloud
// @description soundclod downloader
// @baseurl https://downcloudme.com
// @tags downloader
// @language javascript


const axios = require('axios');
const cheerio = require('cheerio');

async function downcloudme(url) {
    const headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://downcloudme.com',
        'referer': 'https://downcloudme.com/soundcloud-playlist-downloader/',
        'user-agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'content-type': 'application/x-www-form-urlencoded'
    };

    const params = new URLSearchParams();
    params.append('url', url);

    const response = await axios.post('https://downcloudme.com/download', params.toString(), { headers });
    const $ = cheerio.load(response.data);
    const tracks = [];

    $('.custom-track-container').each((i, el) => {
        const title = $(el).find('.custom-track-title').text().trim();
        const image = $(el).find('.custom-track-image').attr('src');
        const detailsText = $(el).find('.custom-track-details').text();
        const durationMatch = detailsText.match(/Duration:\s*([^\n]+)/);
        const likesMatch = detailsText.match(/Likes:\s*([^\n]+)/);
        const duration = durationMatch ? durationMatch[1].trim() : '';
        const likes = likesMatch ? likesMatch[1].trim() : '';
        const downloadLink = $(el).find('.custom-download-btn').attr('href');

        if (downloadLink) {
            tracks.push({
                title,
                image,
                duration,
                likes,
                download_url: downloadLink.startsWith('http') ? downloadLink : `https://downcloudme.com${downloadLink}`
            });
        }
    });

    return tracks;
}

(async () => {
    const result = await downcloudme('https://soundcloud.com/melanielouis/sets/rain-sounds');
    console.log(JSON.stringify(result, null, 2));
})();
