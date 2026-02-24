// @author Rizki
// @title Movieku
// @description search and get details of anime and download it.
// @baseurl https://movieku.fit
// @tags search,downloader
// @language javascript

const axios = require('axios');
const cheerio = require('cheerio');

async function MovieKu(query) {
  const searchUrl = `https://movieku.fit/?s=${encodeURIComponent(query)}`;
  const searchResponse = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
 
  const $search = cheerio.load(searchResponse.data);
  const searchResults = {
    query: query,
    results: []
  };
 
  $search('.los article.box').each((i, el) => {
    const article = $search(el);
    const link = article.find('a.tip');
    const title = link.attr('title') || link.find('h2.entry-title').text();
    const url = link.attr('href');
    const img = article.find('img').attr('src');
    const quality = article.find('.quality').text();
    const year = title.match(/\((\d{4})\)/)?.[1] || '';
   
    searchResults.results.push({
      title: title,
      url: url,
      image: img,
      quality: quality,
      year: year,
      type: 'Movie'
    });
  });
 
  const firstResult = searchResults.results[0];
  if (!firstResult) {
    return {
      search: searchResults,
      detail: {}
    };
  }
 
  const detailResponse = await axios.get(firstResult.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
 
  const $detail = cheerio.load(detailResponse.data);
  const detail = {
    title: firstResult.title,
    url: firstResult.url,
    image: firstResult.image,
    synopsis: '',
    genres: [],
    release: '',
    duration: '',
    country: '',
    quality: firstResult.quality,
    rating: '',
    downloads: []
  };
 
  const synopsisEl = $detail('.synops .entry-content p').first();
  detail.synopsis = synopsisEl.text().trim();
 
  $detail('.data li').each((i, el) => {
    const text = $detail(el).text();
    if (text.includes('Genre:')) {
      $detail(el).find('a').each((j, a) => {
        detail.genres.push($detail(a).text());
      });
    } else if (text.includes('Release:')) {
      detail.release = text.replace('Release:', '').trim();
    } else if (text.includes('Duration:')) {
      detail.duration = text.replace('Duration:', '').trim();
    } else if (text.includes('Country:')) {
      detail.country = text.replace('Country:', '').trim();
    } else if (text.includes('Rating:')) {
      detail.rating = text.replace('Rating:', '').trim();
    }
  });
 
  $detail('#smokeddl .smokeurl p').each((i, el) => {
    const quality = $detail(el).find('strong').text().replace(':', '').trim();
    const links = [];
   
    $detail(el).find('a').each((j, a) => {
      links.push({
        provider: $detail(a).text().trim(),
        url: $detail(a).attr('href')
      });
    });
   
    if (quality) {
      detail.downloads.push({
        quality: quality,
        links: links
      });
    }
  });
 
  return {
    search: searchResults,
    detail: detail
  };
}

(async () => {
  const result = await MovieKu('boruto');
  console.log(JSON.stringify(result, null, 2));
})();