// @author Rizki
// @title Komiku
// @description search and read comics, then take pictures and chapters
// @tags search
// @language javascript

const axios = require('axios');
const cheerio = require('cheerio');

class komiku {
    constructor() {
        this.baseUrl = 'https://komiku.org';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://komiku.org/',
            'Cache-Control': 'no-cache'
        };
    }

    async searchManga(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/`, {
                params: {
                    s: query,
                    post_type: 'manga'
                },
                headers: this.headers
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('.daftar .bge, .daftar .kan, .list-update .bge').each((i, el) => {
                const title = $(el).find('.judul2 a, h3 a').text().trim();
                const url = $(el).find('.judul2 a, h3 a').attr('href');
                const image = $(el).find('img').attr('src');
                const type = $(el).find('.tipe, .type').text().trim();
                const description = $(el).find('p').text().trim();
                
                if (title && title.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        title,
                        url: url ? (url.startsWith('http') ? url : this.baseUrl + url) : null,
                        image: image ? (image.startsWith('http') ? image : 'https:' + image) : null,
                        type: type || 'Manga',
                        description: description || 'No description available'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Search error:', error.message);
            return [];
        }
    }

    async getMangaDetail(url) {
        try {
            const response = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(response.data);

            const title = $('#Judul h1 span').first().text().trim() || $('h1.entry-title').text().trim();
            const altTitle = $('.j2').text().trim().replace(':', '').trim();
            const cover = $('.ims img').attr('src') || $('.thumb img').attr('src');
            const author = $('.inftable tr:contains("Pengarang") td:last-child, .inftable tr:contains("Author") td:last-child').text().trim();
            const status = $('.inftable tr:contains("Status") td:last-child').text().trim();
            const type = $('.inftable tr:contains("Jenis Komik") td:last-child, .inftable tr:contains("Type") td:last-child').text().trim();
            const genres = [];
            
            $('.genre li a, .genres a').each((i, el) => {
                const genre = $(el).text().trim();
                if (genre && !genre.includes('Genre')) genres.push(genre);
            });

            const synopsis = $('.desc, .sinopsis, .entry-content p').first().text().trim();

            const chapters = [];
            $('#daftarChapter tr, .chapter-list li, .clstyle li').each((i, el) => {
                if (i === 0 && $(el).is('tr')) return;
                
                const chapterEl = $(el).find('.judulseries a, .chapter-title a, a');
                const chapterTitle = chapterEl.text().trim();
                const chapterUrl = chapterEl.attr('href');
                const views = $(el).find('.pembaca i, .views').text().trim();
                const date = $(el).find('.tanggalseries, .date').text().trim();
                
                if (chapterTitle && chapterUrl) {
                    chapters.push({
                        title: chapterTitle,
                        url: chapterUrl.startsWith('http') ? chapterUrl : this.baseUrl + chapterUrl,
                        views: views ? parseInt(views.replace(/[^0-9]/g, '')) || 0 : 0,
                        date: date || 'Unknown'
                    });
                }
            });

            chapters.sort((a, b) => {
                const numA = parseFloat(a.title.replace(/[^0-9.]/g, ''));
                const numB = parseFloat(b.title.replace(/[^0-9.]/g, ''));
                return numB - numA;
            });

            const firstChapterUrl = chapters.length > 0 ? chapters[chapters.length - 1].url : null;
            const latestChapterUrl = chapters.length > 0 ? chapters[0].url : null;

            return {
                title,
                altTitle: altTitle || title,
                cover: cover ? (cover.startsWith('http') ? cover : 'https:' + cover) : null,
                author: author || 'Unknown',
                status: status || 'Ongoing',
                type: type || 'Manga',
                genres: [...new Set(genres)],
                synopsis: synopsis || 'No synopsis available',
                chapters: chapters.slice(0, 10),
                totalChapters: chapters.length,
                firstChapterUrl,
                latestChapterUrl
            };
        } catch (error) {
            console.error('Detail error:', error.message);
            return null;
        }
    }

    async getChapterImages(url) {
        try {
            const response = await axios.get(url, { headers: this.headers });
            const $ = cheerio.load(response.data);

            const title = $('#Judul h1').text().trim() || $('h1.entry-title').text().trim();
            const seriesTitle = $('a[rel="tag"]').first().text().trim() || $('.series a').first().text().trim();
            const seriesUrl = $('a[rel="tag"]').first().attr('href') || $('.series a').first().attr('href');
            
            const images = [];
            $('#Baca_Komik img, .chapter-image img, .reader-area img').each((i, el) => {
                const imgUrl = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
                if (imgUrl && imgUrl.startsWith('http')) {
                    images.push({
                        url: imgUrl,
                        page: i + 1,
                        alt: $(el).attr('alt') || `Page ${i + 1}`
                    });
                }
            });

            const prevChapter = $('a[aria-label="Prev"], a.prev, a:contains("Sebelumnya")').attr('href');
            const nextChapter = $('a[aria-label="Next"], a.next, a:contains("Selanjutnya")').attr('href');

            return {
                title: title || 'Unknown Chapter',
                series: {
                    title: seriesTitle || 'Unknown Series',
                    url: seriesUrl ? (seriesUrl.startsWith('http') ? seriesUrl : this.baseUrl + seriesUrl) : null
                },
                images: images.length > 0 ? images : [],
                totalImages: images.length,
                navigation: {
                    prev: prevChapter ? (prevChapter.startsWith('http') ? prevChapter : this.baseUrl + prevChapter) : null,
                    next: nextChapter ? (nextChapter.startsWith('http') ? nextChapter : this.baseUrl + nextChapter) : null
                }
            };
        } catch (error) {
            console.error('Chapter error:', error.message);
            return null;
        }
    }

    async getAll(query) {
        const search = await this.searchManga(query);
        
        if (search.length === 0) {
            const fallbackDetail = await this.getMangaDetail(`https://komiku.org/manga/${query}-id/`);
            
            if (fallbackDetail) {
                const chapter = await this.getChapterImages(fallbackDetail.latestChapterUrl);
                return {
                    query,
                    search: [{
                        title: fallbackDetail.title,
                        url: `https://komiku.org/manga/${query}-id/`,
                        image: fallbackDetail.cover,
                        type: fallbackDetail.type,
                        description: fallbackDetail.synopsis.substring(0, 200)
                    }],
                    detail: fallbackDetail,
                    chapter
                };
            }
            
            return {
                query,
                search: [],
                detail: null,
                chapter: null,
                message: 'No results found'
            };
        }

        const mangaUrl = search[0].url;
        const detail = await this.getMangaDetail(mangaUrl);
        const chapter = detail ? await this.getChapterImages(detail.latestChapterUrl) : null;

        return {
            query,
            search: search.slice(0, 5),
            detail,
            chapter
        };
    }
}

(async () => {
    const scraper = new komiku();
    const result = await scraper.getAll('boruto');
    console.log(JSON.stringify(result, null, 2));
})();