// Jest setup file for Discord.js bot testing
const { jest } = require('@jest/globals');

// Discord.js test setup and mocks
class MockCollection extends Map {
    constructor() {
        super();
    }
}

class MockClient {
    constructor() {
        this.login = jest.fn().mockResolvedValue('mock-token');
        this.commands = new MockCollection();
        this.cooldowns = new MockCollection();
    }
}

const discordMocks = {
  Client: jest.fn().mockImplementation(() => new MockClient()),
  Collection: jest.fn().mockImplementation(() => new MockCollection()),
  GatewayIntentBits: {
    Guilds: 'Guilds'
  }
};

jest.mock('discord.js', () => discordMocks);