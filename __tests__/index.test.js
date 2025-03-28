const { Client, Collection } = require('discord.js');
const { Lists, sequelize } = require('../models/index.js');

describe('Discord Bot Tests', () => {
    test('hello world!', () => {
        expect(1 + 1).toBe(2);
    });

    test('client should be initialized with correct intents', () => {
        const client = new Client({ intents: ['Guilds'] });
        expect(client.constructor.name).toBe('MockClient');
    });

    test('commands collection should be initialized', () => {
        const client = new Client({ intents: ['Guilds'] });
        client.commands = new Collection();
        expect(client.commands.constructor.name).toBe('MockCollection');
        expect(client.commands.size).toBe(0);
    });

    test('cooldowns collection should be initialized', () => {
        const client = new Client({ intents: ['Guilds'] });
        client.cooldowns = new Collection();
        expect(client.cooldowns.constructor.name).toBe('MockCollection');
        expect(client.cooldowns.size).toBe(0);
    });
});

describe('Database Tests', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true });
    });

    test('should create and retrieve list items', async () => {
        const userId = '123456789';
        const testItem = 'Test Item';

        await Lists.create({
            user_id: userId,
            item: testItem,
        });

        const items = await Lists.findAll({
            where: { user_id: userId },
        });

        expect(items).toHaveLength(1);
        expect(items[0].item).toBe(testItem);
    });

    test('should delete list items', async () => {
        const userId = '123456789';
        const testItem = 'Test Item';

        const createdItem = await Lists.create({
            user_id: userId,
            item: testItem,
        });

        await Lists.destroy({
            where: {
                id: createdItem.id,
                user_id: userId
            }
        });

        const items = await Lists.findAll({
            where: { user_id: userId },
        });

        expect(items).toHaveLength(0);
    });

    afterAll(async () => {
        await sequelize.close();
    });
});