import { EdgarCLI } from '../../src/cli';
import { ToolManager } from '../../src/tools/tool-manager';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Edgar Integration Tests', () => {
  let testDir: string;
  let cli: EdgarCLI;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `edgar-test-${Date.now()}`);
    fs.ensureDirSync(testDir);
    process.chdir(testDir);

    // Create CLI instance
    cli = new EdgarCLI();
  });

  afterEach(() => {
    // Clean up test directory
    process.chdir(os.tmpdir());
    fs.removeSync(testDir);
  });

  describe('Tool Integration', () => {
    it('should have all tools registered', () => {
      const toolManager = new ToolManager();
      
      expect(toolManager.hasTool('Read')).toBe(true);
      expect(toolManager.hasTool('Write')).toBe(true);
      expect(toolManager.hasTool('Edit')).toBe(true);
      expect(toolManager.hasTool('Bash')).toBe(true);
      expect(toolManager.hasTool('Glob')).toBe(true);
      expect(toolManager.hasTool('Grep')).toBe(true);
    });

    it('should execute Write tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      const filePath = path.join(testDir, 'test.txt');
      
      const result = await toolManager.executeTool('Write', {
        file_path: filePath,
        content: 'Hello, Edgar!'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('Hello, Edgar!');
    });

    it('should execute Read tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      const filePath = path.join(testDir, 'test.txt');
      
      // Write a file first
      fs.writeFileSync(filePath, 'Test content');

      const result = await toolManager.executeTool('Read', {
        file_path: filePath
      });

      expect(result.content).toContain('Test content');
    });

    it('should execute Edit tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      const filePath = path.join(testDir, 'test.txt');
      
      // Write a file first
      fs.writeFileSync(filePath, 'Hello world');

      const result = await toolManager.executeTool('Edit', {
        file_path: filePath,
        old_string: 'world',
        new_string: 'Edgar'
      });

      expect(result.success).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('Hello Edgar');
    });

    it('should execute Bash tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      
      const result = await toolManager.executeTool('Bash', {
        command: 'echo "Hello from Edgar"'
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello from Edgar');
    });

    it('should execute Glob tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      
      // Create some test files
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
      fs.writeFileSync(path.join(testDir, 'file3.js'), 'content3');

      const result = await toolManager.executeTool('Glob', {
        pattern: '*.txt',
        path: testDir
      });

      expect(result.count).toBe(2);
      expect(result.files).toHaveLength(2);
    });

    it('should execute Grep tool through ToolManager', async () => {
      const toolManager = new ToolManager();
      
      // Create test files with content
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'Hello Edgar\nThis is a test');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'Another file\nWith Edgar mentioned');

      const result = await toolManager.executeTool('Grep', {
        pattern: 'Edgar',
        path: testDir,
        output_mode: 'files_with_matches'
      });

      expect(result.matches).toBe(2);
    });
  });

  describe('CLI Functionality', () => {
    it('should parse command arguments correctly', async () => {
      const result = await cli.parseArgs(['commit']);
      expect(result.mode).toBe('commit');
    });

    it('should parse query mode', async () => {
      const result = await cli.parseArgs(['-p', 'What is this?']);
      expect(result.mode).toBe('query');
      expect(result.query).toBe('What is this?');
    });

    it('should parse continue mode', async () => {
      const result = await cli.parseArgs(['-c']);
      expect(result.mode).toBe('continue');
    });

    it('should have interactive commands', () => {
      expect(cli.getInteractiveCommand('/help')).toBeDefined();
      expect(cli.getInteractiveCommand('/clear')).toBeDefined();
      expect(cli.getInteractiveCommand('/settings')).toBeDefined();
      expect(cli.getInteractiveCommand('/exit')).toBeDefined();
    });

    it('should validate Node.js version', () => {
      expect(cli.checkNodeVersion()).toBe(true);
    });
  });

  describe('Master Loop', () => {
    it('should execute tasks with tool calls', async () => {
      const masterLoop = cli['masterLoop'];
      
      // Mock the LLM to return a tool call
      masterLoop['llmClient'].sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'I will create a test file',
          toolCalls: [{
            name: 'Write',
            parameters: {
              file_path: path.join(testDir, 'loop-test.txt'),
              content: 'Created by master loop'
            }
          }]
        })
        .mockResolvedValueOnce({
          content: 'File created successfully',
          toolCalls: []
        });

      await masterLoop.executeTask('Create a test file');

      expect(fs.existsSync(path.join(testDir, 'loop-test.txt'))).toBe(true);
      expect(fs.readFileSync(path.join(testDir, 'loop-test.txt'), 'utf-8')).toBe('Created by master loop');
    });
  });

  describe('Session Management', () => {
    it('should create and persist sessions', async () => {
      const sessionManager = cli['sessionManager'];
      
      const session = await sessionManager.createSession();
      expect(session.id).toBeDefined();
      
      await sessionManager.addMessage({
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      });

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.messages).toHaveLength(1);
      expect(currentSession?.messages[0].content).toBe('Test message');
    });
  });

  describe('Configuration', () => {
    it('should load default configuration', () => {
      const config = cli.config;
      
      expect(config.get('model')).toBeDefined();
      expect(config.get('maxTokens')).toBeDefined();
      expect(config.get('temperature')).toBeDefined();
    });

    it('should save and load configuration', () => {
      const config = cli.config;
      
      config.set('testKey', 'testValue');
      config.save('project');
      
      // Create new config instance to test loading
      const newConfig = new (require('../../src/config/config-manager').ConfigManager)();
      expect(newConfig.get('testKey')).toBe('testValue');
    });
  });
});