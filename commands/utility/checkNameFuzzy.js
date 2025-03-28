const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const fuzzysort = require('fuzzysort');
const checkUniRoster = require('./checkuniroster.js');
const { Lists } = require('../../models/index.js');

// Add a fallback for MessageFlags in case it's undefined
const EPHEMERAL_FLAG = MessageFlags?.Ephemeral || 64;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fuzzycheck')
        .setDescription('Checks if any characters in player\'s roster match known names')
        .addStringOption(option =>
            option.setName('playername')
                .setDescription('Player whose roster to check')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: EPHEMERAL_FLAG });
            const playerName = interaction.options.getString('playername');

            // Get items from Lists instead of Characters
            let dbItems;
            if (process.env.NODE_ENV === 'test') {
                dbItems = [{ item: 'TestCharacter1' }, { item: 'TestCharacter2' }];
            } else {
                dbItems = await Lists.findAll();
            }
            
            const dbNames = dbItems.map(item => item.item);

            // Add debug logging
            console.log('Database names to check against:', dbNames);

            // Rest of the code remains the same
            const rosterInteraction = {
                options: {
                    getString: () => playerName
                },
                deferReply: async () => {},
                editReply: async (response) => {
                    if (typeof response === 'string') {
                        const rosterList = response.split('\n').slice(1); // Skip header
                        
                        console.log('Raw response:', response);
                        console.log('Roster List after split:', rosterList);
                        console.log('Database Names:', dbNames);
                        
                        await interaction.editReply({
                            content: `${playerName}'s roster: ${rosterList.join(', ')}\n\nChecking for matches...`,
                            flags: EPHEMERAL_FLAG
                        });

                        let matches = [];
                        for (const rosterName of rosterList) {
                            console.log('Checking roster name:', rosterName);
                            const results = fuzzysort.go(rosterName, dbNames, {
                                threshold: -2000,
                                limit: 3
                            });
                            console.log('Fuzzy results:', results);
                            if (results.length > 0) {
                                matches.push(`${rosterName} matches: ${results.map(r => r.target).join(', ')}`);
                            }
                        }

                        const finalMessage = matches.length > 0
                            ? `${playerName}'s roster: ${rosterList.join(', ')}\n\nMatches found:\n${matches.join('\n')}`
                            : `${playerName}'s roster: ${rosterList.join(', ')}\n\nNo matches found.`;

                        await interaction.editReply({
                            content: finalMessage,
                            flags: EPHEMERAL_FLAG
                        });
                    }
                }
            };

            await checkUniRoster.execute(rosterInteraction);

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'Error searching roster. Please try again later.',
                flags: EPHEMERAL_FLAG
            });
        }
    },
};