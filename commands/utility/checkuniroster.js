const { SlashCommandBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkuniroster')
        .setDescription('Check a player\'s roster on uwuowo.moe')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The character name to look up')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const username = interaction.options.getString('username');

        try {
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();

            // Navigate to the character page
            await page.goto(`https://uwuowo.mathi.moe/character/NAE/${username}/roster`);
            await page.waitForSelector('a[href*="/character/NAE/"]', { timeout: 5000 });

            // Extract roster information
            const roster = await page.evaluate(() => {
                const rosterLinks = Array.from(document.querySelectorAll('a[href*="/character/NAE/"]'));
                return rosterLinks.map(link => {
                    const name = link.querySelector('p.text-lg.font-semibold')?.textContent.split(' ')[0];
                    // Remove item level from display
                    return name || null;
                }).filter(Boolean);
            });

            await browser.close();

            if (roster.length === 0) {
                await interaction.editReply('No roster found for this character.');
                return;
            }

            const response = `**${username}'s Roster:**\n${roster.join('\n')}`;
            await interaction.editReply(response);

        } catch (error) {
            console.error(error);
            await interaction.editReply('Error fetching roster information. The character might not exist or the website is unavailable.');
        }
    },
};