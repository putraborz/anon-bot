import { Telegraf } from "telegraf"

const bot = new Telegraf(process.env.BOT_TOKEN)

/* ====== STORAGE (RAM) ====== */
let waiting = []
let pairs = {}
let settings = {} // userId: { gender, looking }

/* ====== UTIL ====== */
function getSettings(id) {
  if (!settings[id]) {
    settings[id] = { gender: "Any", looking: "Any" }
  }
  return settings[id]
}

function matchUsers(userId) {
  const userSet = getSettings(userId)

  for (let i = 0; i < waiting.length; i++) {
    const otherId = waiting[i]
    const otherSet = getSettings(otherId)

    if (
      (userSet.looking === "Any" || userSet.looking === otherSet.gender) &&
      (otherSet.looking === "Any" || otherSet.looking === userSet.gender)
    ) {
      waiting.splice(i, 1)
      pairs[userId] = otherId
      pairs[otherId] = userId

      bot.telegram.sendMessage(userId, "✅ Partner ditemukan! Mulai chat.")
      bot.telegram.sendMessage(otherId, "✅ Partner ditemukan! Mulai chat.")
      return true
    }
  }
  return false
}

/* ====== COMMANDS ====== */

bot.start(ctx => {
  ctx.reply(
    "🤖 Anonymous Chat Bot\n\n" +
    "/search — cari partner\n" +
    "/next — ganti partner\n" +
    "/stop — hentikan chat\n" +
    "/settings — pengaturan\n" +
    "/rules — aturan"
  )
})

bot.command("rules", ctx => {
  ctx.reply(
    "📜 Rules:\n" +
    "1. No spam\n" +
    "2. No porn\n" +
    "3. No hate speech\n" +
    "4. Hormati partner\n\n" +
    "⚠️ Pelanggaran bisa auto disconnect"
  )
})

bot.command("settings", ctx => {
  ctx.reply(
    "⚙️ Settings:\n\n" +
    "Set gender kamu:\n" +
    "/gender_male\n" +
    "/gender_female\n" +
    "/gender_any\n\n" +
    "Cari gender:\n" +
    "/looking_male\n" +
    "/looking_female\n" +
    "/looking_any"
  )
})

bot.command("gender_male", ctx => {
  getSettings(ctx.from.id).gender = "Male"
  ctx.reply("✅ Gender diset ke Male")
})

bot.command("gender_female", ctx => {
  getSettings(ctx.from.id).gender = "Female"
  ctx.reply("✅ Gender diset ke Female")
})

bot.command("gender_any", ctx => {
  getSettings(ctx.from.id).gender = "Any"
  ctx.reply("✅ Gender diset ke Any")
})

bot.command("looking_male", ctx => {
  getSettings(ctx.from.id).looking = "Male"
  ctx.reply("🔍 Cari partner: Male")
})

bot.command("looking_female", ctx => {
  getSettings(ctx.from.id).looking = "Female"
  ctx.reply("🔍 Cari partner: Female")
})

bot.command("looking_any", ctx => {
  getSettings(ctx.from.id).looking = "Any"
  ctx.reply("🔍 Cari partner: Any")
})

bot.command("search", ctx => {
  const id = ctx.from.id

  if (pairs[id]) {
    return ctx.reply("⚠️ Kamu masih dalam chat. Gunakan /next atau /stop")
  }

  if (!matchUsers(id)) {
    waiting.push(id)
    ctx.reply("⏳ Mencari partner...")
  }
})

bot.command("next", ctx => {
  const id = ctx.from.id
  const partner = pairs[id]

  if (partner) {
    delete pairs[partner]
    delete pairs[id]
    bot.telegram.sendMessage(partner, "❌ Partner keluar")
  }

  ctx.reply("🔄 Mencari partner baru...")
  matchUsers(id) || waiting.push(id)
})

bot.command("stop", ctx => {
  const id = ctx.from.id
  const partner = pairs[id]

  if (partner) {
    delete pairs[partner]
    bot.telegram.sendMessage(partner, "❌ Partner menghentikan chat")
  }

  delete pairs[id]
  waiting = waiting.filter(u => u !== id)

  ctx.reply("🛑 Chat dihentikan")
})

/* ====== MESSAGE RELAY ====== */
bot.on("text", ctx => {
  const id = ctx.from.id
  const partner = pairs[id]

  if (!partner) return

  bot.telegram.sendMessage(partner, ctx.message.text)
})

/* ====== VERCEL HANDLER ====== */
export default async function handler(req, res) {
  await bot.handleUpdate(req.body)
  res.status(200).send("OK")
    }
