// Mock discord.js before other imports
jest.mock('discord.js', () => ({
    SlashCommandBuilder: jest.fn().mockImplementation(() => ({
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addStringOption: jest.fn().mockReturnThis()
    }))
}));

const { execute } = require('../../../commands/utility/checkuniroster');
const puppeteer = require('puppeteer');

// Mock puppeteer
jest.mock('puppeteer', () => ({
    launch: jest.fn(),
}));

describe('checkuniroster command', () => {
    let mockInteraction;
    let mockBrowser;
    let mockPage;

    beforeEach(() => {
        // Reset mocks
        mockInteraction = {
            deferReply: jest.fn(),
            editReply: jest.fn(),
            options: {
                getString: jest.fn()
            }
        };

        // Setup puppeteer mocks
        mockPage = {
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            evaluate: jest.fn(),
            close: jest.fn()
        };

        mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn()
        };

        puppeteer.launch.mockResolvedValue(mockBrowser);
    });

    test('should fetch and display roster information', async () => {
        // Arrange
        const username = 'TestUser';
        const mockRoster = ['Character1 (1370)', 'Character2 (1415)'];
        
        mockInteraction.options.getString.mockReturnValue(username);
        mockPage.evaluate.mockResolvedValue(mockRoster);

        // Act
        await execute(mockInteraction);

        // Assert
        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockPage.goto).toHaveBeenCalledWith(
            `https://uwuowo.mathi.moe/character/NAE/${username}/roster`
        );
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            `**${username}'s Roster:**\nCharacter1 (1370)\nCharacter2 (1415)`
        );
        expect(mockBrowser.close).toHaveBeenCalled();
    });

    test('should handle empty roster', async () => {
        // Arrange
        mockInteraction.options.getString.mockReturnValue('TestUser');
        mockPage.evaluate.mockResolvedValue([]);

        // Act
        await execute(mockInteraction);

        // Assert
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'No roster found for this character.'
        );
    });

    test('should handle errors', async () => {
        // Arrange
        mockInteraction.options.getString.mockReturnValue('TestUser');
        mockPage.goto.mockRejectedValue(new Error('Network error'));

        // Act
        await execute(mockInteraction);

        // Assert
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            'Error fetching roster information. The character might not exist or the website is unavailable.'
        );
    });
});