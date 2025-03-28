const { SlashCommandBuilder } = require('discord.js');
const { Lists } = require('../../models/index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Manage your list')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add an item to your list')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show your list'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an item from your list')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('The number of the item to delete')
                        .setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'add') {
            const item = interaction.options.getString('item');
            await Lists.create({
                user_id: interaction.user.id,
                item: item,
            });
            await interaction.reply(`Added "${item}" to your list!`);
        }
        else if (interaction.options.getSubcommand() === 'show') {
            const list = await Lists.findAll({
                where: { user_id: interaction.user.id },
            });
            
            if (list.length === 0) {
                await interaction.reply('Your list is empty!');
                return;
            }

            const items = list.map((item, index) => `${index + 1}. ${item.item}`).join('\n');
            await interaction.reply(`Your list:\n${items}`);
        }
        else if (interaction.options.getSubcommand() === 'delete') {
            const list = await Lists.findAll({
                where: { user_id: interaction.user.id },
            });
            
            if (list.length === 0) {
                await interaction.reply('Your list is empty!');
                return;
            }

            const itemNumber = interaction.options.getInteger('number');
            if (itemNumber < 1 || itemNumber > list.length) {
                await interaction.reply(`Please provide a number between 1 and ${list.length}`);
                return;
            }

            const itemToDelete = list[itemNumber - 1];
            await Lists.destroy({
                where: {
                    id: itemToDelete.id,
                    user_id: interaction.user.id
                }
            });

            await interaction.reply(`Deleted "${itemToDelete.item}" from your list!`);
        }
    },
};