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

const config = {
  baseUrl: 'https://uwuowo.mathi.moe/character/NAE',
  usernameSelector: 'a p.text-lg.font-semibold',
  commandPrefix: '!check'
};

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} is ready!`);
});

async function scrapeUsernames(username) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const url = `${config.baseUrl}/${username}/roster`;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const usernames = await page.$$eval(config.usernameSelector, elements => 
      elements.map(el => {
        // Clean up username text
        const name = el.textContent
          .replace(/[^a-zA-Z0-9ßẞ\u00C0-\u017F]/g, '') // Allow special characters
          .replace(/\d+\.?\d*/g, '') // Remove item levels
          .trim();
        return name;
      }).filter(name => name.length > 0)
    );

    await browser.close();
    return [...new Set(usernames)]; // Remove duplicates
  } catch (error) {
    console.error('Scraping error:', error);
    await browser.close();
    return [];
  }
}

async function checkMessages(channel, username) {
  try {
    const [messages, usernames] = await Promise.all([
      channel.messages.fetch({ limit: 100 }),
      scrapeUsernames(username)
    ]);

    let foundMatches = false;

    messages.forEach(message => {
      usernames.forEach(targetUsername => {
        if (message.content.toLowerCase().includes(targetUsername.toLowerCase())) {
          foundMatches = true;
          channel.send({
            content: `⚠️ Match found for ${targetUsername} in message from ${message.author.tag}:\n"${message.content}"`,
            reply: { messageReference: message.id }
          });
        }
      });
    });

    if (!foundMatches) {
      channel.send(`✅ No matching usernames found for ${username}'s roster`);
    }

  } catch (error) {
    console.error('Error during check:', error);
    channel.send('❌ Failed to process request. Please try again later.');
  }
}

client.on('messageCreate', async message => {
  if (
    message.author.bot ||
    !message.content.startsWith(config.commandPrefix)
  ) return;

  const args = message.content.slice(config.commandPrefix.length).trim().split(/ +/);
  const username = args[0];

  if (!username) {
    return message.channel.send('Please specify a username: `!check <username>`');
  }

  try {
    await message.channel.sendTyping();
    await checkMessages(message.channel, username);
  } catch (error) {
    console.error('Error handling command:', error);
    message.channel.send('❌ An error occurred while processing your request');
  }
});

client.login(process.env.DISCORD_TOKEN);