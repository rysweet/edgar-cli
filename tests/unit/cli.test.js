"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("../../src/cli");
const config_manager_1 = require("../../src/config/config-manager");
describe('EdgarCLI', () => {
    let cli;
    beforeEach(() => {
        cli = new cli_1.EdgarCLI();
    });
    describe('initialization', () => {
        it('should create a new CLI instance', () => {
            expect(cli).toBeDefined();
            expect(cli).toBeInstanceOf(cli_1.EdgarCLI);
        });
        it('should have a run method', () => {
            expect(cli.run).toBeDefined();
            expect(typeof cli.run).toBe('function');
        });
        it('should initialize with default configuration', () => {
            expect(cli.config).toBeDefined();
            expect(cli.config).toBeInstanceOf(config_manager_1.ConfigManager);
        });
    });
    describe('command parsing', () => {
        it('should parse interactive mode command (no args)', async () => {
            const result = await cli.parseArgs([]);
            expect(result.mode).toBe('interactive');
            expect(result.task).toBeUndefined();
        });
        it('should parse task mode command', async () => {
            const result = await cli.parseArgs(['fix the bug in main.js']);
            expect(result.mode).toBe('task');
            expect(result.task).toBe('fix the bug in main.js');
        });
        it('should parse query mode command (-p flag)', async () => {
            const result = await cli.parseArgs(['-p', 'what is this function?']);
            expect(result.mode).toBe('query');
            expect(result.query).toBe('what is this function?');
        });
        it('should parse continue mode (-c flag)', async () => {
            const result = await cli.parseArgs(['-c']);
            expect(result.mode).toBe('continue');
        });
        it('should parse resume mode (-r flag)', async () => {
            const result = await cli.parseArgs(['-r']);
            expect(result.mode).toBe('resume');
        });
        it('should parse commit command', async () => {
            const result = await cli.parseArgs(['commit']);
            expect(result.mode).toBe('commit');
        });
    });
    describe('interactive commands', () => {
        it('should support /clear command', () => {
            const command = cli.getInteractiveCommand('/clear');
            expect(command).toBeDefined();
            expect(command.name).toBe('clear');
        });
        it('should support /help command', () => {
            const command = cli.getInteractiveCommand('/help');
            expect(command).toBeDefined();
            expect(command.name).toBe('help');
        });
        it('should support /settings command', () => {
            const command = cli.getInteractiveCommand('/settings');
            expect(command).toBeDefined();
            expect(command.name).toBe('settings');
        });
        it('should support /exit command', () => {
            const command = cli.getInteractiveCommand('/exit');
            expect(command).toBeDefined();
            expect(command.name).toBe('exit');
        });
    });
    describe('error handling', () => {
        it('should handle invalid flags gracefully', async () => {
            await expect(cli.parseArgs(['--invalid-flag'])).rejects.toThrow();
        });
        it('should validate Node.js version', () => {
            expect(cli.checkNodeVersion()).toBe(true);
        });
    });
});
//# sourceMappingURL=cli.test.js.map