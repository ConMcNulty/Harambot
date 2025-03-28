// Mock discord.js first
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis()
    })),
    MessageFlags: {
        Ephemeral: 64
    }
}));

const { jest } = require('@jest/globals');

// Mock fuzzysort
const mockGo = jest.fn().mockReturnValue([{ target: 'TestChar1' }]);
jest.mock('fuzzysort', () => ({
    go: mockGo
}));

// Mock Characters model
jest.mock('../../models', () => ({
    Characters: {
        findAll: jest.fn().mockResolvedValue([
            { name: 'TestChar1' },
            { name: 'TestChar2' }
        ])
    }
}));

// Mock checkuniroster - this needs to be before requiring the module under test
const mockCheckUniRoster = {
    execute: jest.fn().mockImplementation(async (interaction) => {
        await interaction.editReply('**TestUser\'s Roster:**\nChar1\nChar2');
    })
};
jest.mock('../../commands/utility/checkuniroster.js', () => mockCheckUniRoster);

const { execute } = require('../../commands/utility/checkNameFuzzy');

describe('checkNameFuzzy Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            deferReply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            options: {
                getString: jest.fn().mockReturnValue('TestUser')
            }
        };
        // Reset mocks between tests
        mockCheckUniRoster.execute.mockClear();
        mockGo.mockClear();
        
        // Reset default mockGo behavior
        mockGo.mockReturnValue([{ target: 'TestChar1' }]);
    });

    it('should check roster against database names', async () => {
        process.env.NODE_ENV = 'test';
        await execute(interaction);

        expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 });
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('Matches found in TestUser\'s roster'),
            flags: 64
        });
    });

    it('should handle no matches found', async () => {
        process.env.NODE_ENV = 'test';
        // Clear all matches for this test
        mockGo.mockReturnValue([]);
        
        await execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('No matches found'),
            flags: 64
        });
    });
});