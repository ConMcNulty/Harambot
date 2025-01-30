require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let targetChannelId = 'YOUR_CHANNEL_ID_HERE'; // Replace with actual channel ID
let websiteUrl = 'WEBSITE_URL_TO_SCRAPE'; // Replace with target website

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Scrape usernames from website
async function scrapeUsernames() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(websiteUrl);
  
  // Adjust selector based on website structure
  const usernames = await page.$$eval('selector-for-usernames', elements => 
    elements.map(el => el.textContent.trim())
  );
  
  await browser.close();
  return usernames;
}

// Check messages in channel
async function checkMessages(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const usernames = await scrapeUsernames();
  
  messages.forEach(message => {
    if (usernames.some(username => 
      message.content.toLowerCase().includes(username.toLowerCase())
    )) {
      channel.send(`⚠️ Match found in message from ${message.author.tag}: "${message.content}"`);
    }
  });
}

// Run check when bot receives a message
client.on('messageCreate', async message => {
  if (message.channel.id === targetChannelId && !message.author.bot) {
    await checkMessages(message.channel);
  }
});

client.login(process.env.DISCORD_TOKEN);