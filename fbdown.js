// @author Rizki
// @title FbDown
// @description download url from facebook.
// @baseurl https://y2date.com
// @tags downloader
// @language javascript

const axios = require('axios');
const qs = require('qs');

class FBDown {
  constructor() {
    this.baseURL = 'https://y2date.com';
    this.headers = {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'origin': 'https://y2date.com',
      'referer': 'https://y2date.com/facebook-video-downloader/',
      'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'content-type': 'application/x-www-form-urlencoded'
    };
  }

  async getVideo(url) {
    const token = '3ecace38ab99d0aa20f9560f0c9703787d4957d34d2a2d42bfe5b447f397e03c';
    
    const payload = qs.stringify({
      url: url,
      token: token
    });

    const response = await axios.post(`${this.baseURL}/wp-json/aio-dl/video-data/`, payload, {
      headers: this.headers
    });

    return response.data;
  }
}

(async () => {
  const scraper = new FBDown();
  const result = await scraper.getVideo('https://www.facebook.com/share/r/18Kd6fLeWP/');
  console.log(JSON.stringify(result, null, 2));
})();