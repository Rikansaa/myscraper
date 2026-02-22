// @author Rijal Wangi
// @title Fitur Nano Banana (ESM
// @description fitur nano banana(editimg)
// @baseurl https://y2date.com
// @language javascript

/** 
# Code Editimg
# Yang Punya Anunya https://whatsapp.com/channel/0029Vb7t6q7A89MjyGEBG41y/247
# Follow Channel Aku Dong https://whatsapp.com/channel/0029Vb6ru1s2Jl87BaI4RJ1H
# Join Juga Group Ku https://chat.whatsapp.com/Bhwenfkc5Vi3V2kbTKw7WJ
**/
import cheerio from "cheerio"
import crypto from "crypto"
import fs from "fs"
import FormData from "form-data"
import path from "path"
import axios from "axios"

let handler = async (m, { conn, text }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ""

  if (!mime.startsWith("image/"))
    return m.reply("❌ Kirim atau reply gambar")

  if (!text)
    return m.reply("❌ Prompt wajib diisi")

  await m.react("🕒")

  const buffer = await q.download()
  if (!buffer) return m.reply("❌ Seperti Nya Error Senpai")

  const tmpDir = path.join(process.cwd(), "tmp")
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  const filePath = path.join(tmpDir, `${Date.now()}.jpg`)
  fs.writeFileSync(filePath, buffer)

  try {
    const result = await nanana(filePath, text)

    await conn.sendMessage(
      m.chat,
      {
        image: { url: result.image },
        caption: "✨ Done Bang"
      },
      { quoted: m }
    )
  } catch {
    m.reply("❌ Gagal edit gambar")
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}

handler.help = ["editimg <prompt>"]
handler.tags = ["ai"]
handler.command = ["editimg", "nanana"]
handler.limit = 3

export default handler

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function genxfpid() {
  const p1 = crypto.randomBytes(16).toString("hex")
  const p2 = crypto.randomBytes(32).toString("hex")
  return Buffer.from(`${p1}.${p2}`).toString("base64")
}

const akunlama = {
  inbox: async (recipient) => {
    const url = `https://akunlama.com/api/v1/mail/list?recipient=${recipient}`
    const response = await axios.get(url)
    const messages = response.data
    if (!Array.isArray(messages) || messages.length === 0) return []
    return messages.map(item => ({
      region: item.storage.region,
      key: item.storage.key,
      timestamp: item.timestamp
    }))
  },

  getInbox: async (region, key) => {
    const url = `https://akunlama.com/api/v1/mail/getHtml?region=${region}&key=${key}`
    const response = await axios.get(url)
    const html = response.data
    if (!html || typeof html !== "string")
      return { plainText: "" }

    const $ = cheerio.load(html)
    $("script, style").remove()
    const plainText = $("body").text().replace(/\s+/g, " ").trim()
    return { plainText }
  }
}

const baseHeaders = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  origin: "https://nanana.app",
  referer: "https://nanana.app/en"
}

async function getAuth() {
  const username = crypto.randomBytes(6).toString("hex")
  const email = `${username}@akunlama.com`

  await axios.post(
    "https://nanana.app/api/auth/email-otp/send-verification-otp",
    { email, type: "sign-in" },
    { headers: { ...baseHeaders, "Content-Type": "application/json" } }
  )

  let mailKey, mailRegion
  let attempt = 0

  while (!mailKey) {
    const mails = await akunlama.inbox(username)
    if (mails.length > 0) {
      mailKey = mails[0].key
      mailRegion = mails[0].region
      break
    }
    await delay(3000)
    attempt++
    if (attempt > 20) throw "OTP timeout"
  }

  const mailContent = await akunlama.getInbox(mailRegion, mailKey)
  const otpMatch = mailContent.plainText.match(/\b\d{6}\b/)
  if (!otpMatch) throw "OTP tidak ditemukan"

  const signin = await axios.post(
    "https://nanana.app/api/auth/sign-in/email-otp",
    { email, otp: otpMatch[0] },
    { headers: { ...baseHeaders, "Content-Type": "application/json" } }
  )

  const cookies = signin.headers["set-cookie"]
  const cookieString = cookies
    ? cookies.map(c => c.split(";")[0]).join("; ")
    : ""

  return {
    ...baseHeaders,
    Cookie: cookieString,
    "x-fp-id": genxfpid()
  }
}

async function uploadImage(imgPath, authHeaders) {
  const form = new FormData()
  form.append("image", fs.createReadStream(imgPath))

  const res = await axios.post(
    "https://nanana.app/api/upload-img",
    form,
    { headers: { ...authHeaders, ...form.getHeaders() } }
  )

  return res.data.url
}

async function createJob(imgUrl, prompt, authHeaders) {
  const res = await axios.post(
    "https://nanana.app/api/image-to-image",
    { prompt, image_urls: [imgUrl] },
    { headers: { ...authHeaders, "Content-Type": "application/json" } }
  )

  return res.data.request_id
}

async function cekJob(jobId, authHeaders) {
  const res = await axios.post(
    "https://nanana.app/api/get-result",
    { requestId: jobId, type: "image-to-image" },
    { headers: { ...authHeaders, "Content-Type": "application/json" } }
  )

  return res.data
}

async function nanana(imgPath, prompt) {
  const authHeaders = await getAuth()
  const uploadUrl = await uploadImage(imgPath, authHeaders)
  const jobId = await createJob(uploadUrl, prompt, authHeaders)

  let result
  let attempt = 0

  do {
    await delay(5000)
    result = await cekJob(jobId, authHeaders)
    attempt++
    if (attempt > 30) throw "Job timeout"
  } while (!result.completed)

  if (!result.data?.images?.length) throw "Gagal mendapatkan hasil"

  return {
    job_id: jobId,
    image: result.data.images[0].url
  }
}