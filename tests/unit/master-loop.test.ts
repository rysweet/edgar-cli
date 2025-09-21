import { MasterLoop, ToolCall, LoopMessage } from '../../src/core/master-loop';
import { ConfigManager } from '../../src/config/config-manager';
import { LLMClient } from '../../src/llm/client';
import { ToolManager } from '../../src/tools/tool-manager';
import { HookManager } from '../../src/hooks/hook-manager';

// Mock the dependencies
jest.mock('../../src/llm/client');
jest.mock('../../src/tools/tool-manager');
jest.mock('../../src/hooks/hook-manager');

describe('MasterLoop', () => {
  let masterLoop: MasterLoop;
  let mockConfig: ConfigManager;
  let mockLLMClient: jest.Mocked<LLMClient>;
  let mockToolManager: jest.Mocked<ToolManager>;
  let mockHookManager: jest.Mocked<HookManager>;

  beforeEach(() => {
    // Create mock config
    mockConfig = new ConfigManager();

    // Create master loop (this will create mocked dependencies)
    masterLoop = new MasterLoop(mockConfig);

    // Get references to the mocked dependencies
    mockLLMClient = (masterLoop as any).llmClient;
    mockToolManager = (masterLoop as any).toolManager;
    mockHookManager = (masterLoop as any).hookManager;
  });

  describe('initialization', () => {
    it('should create a new MasterLoop instance', () => {
      expect(masterLoop).toBeDefined();
      expect(masterLoop).toBeInstanceOf(MasterLoop);
    });

    it('should initialize with empty message history', () => {
      expect(masterLoop.getMessageHistory()).toEqual([]);
    });
  });

  describe('executeTask', () => {
    it('should add user task to message history', async () => {
      const task = 'Create a hello world function';
      
      // Mock LLM response with no tool calls
      mockLLMClient.sendMessage = jest.fn().mockResolvedValue({
        content: 'I created the hello world function.',
        toolCalls: []
      });

      await masterLoop.executeTask(task);

      const history = masterLoop.getMessageHistory();
      expect(history[0]).toEqual({
        role: 'user',
        content: task
      });
    });

    it('should process tool calls from LLM response', async () => {
      const task = 'Read the file main.js';
      
      // Mock LLM response with tool calls
      const toolCall: ToolCall = {
        name: 'Read',
        parameters: { file_path: 'main.js' }
      };

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'I will read the file main.js',
          toolCalls: [toolCall]
        })
        .mockResolvedValueOnce({
          content: 'The file contains a hello world function.',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn().mockResolvedValue({
        content: 'console.log("Hello World");'
      });

      await masterLoop.executeTask(task);

      expect(mockToolManager.executeTool).toHaveBeenCalledWith(
        'Read',
        { file_path: 'main.js' }
      );
    });

    it('should fire pre and post tool hooks', async () => {
      const task = 'Write a file';
      
      const toolCall: ToolCall = {
        name: 'Write',
        parameters: { file_path: 'test.js', content: 'test' }
      };

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'I will write the file',
          toolCalls: [toolCall]
        })
        .mockResolvedValueOnce({
          content: 'File written successfully.',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn().mockResolvedValue({
        success: true
      });

      mockHookManager.fireHook = jest.fn().mockResolvedValue(undefined);

      await masterLoop.executeTask(task);

      expect(mockHookManager.fireHook).toHaveBeenCalledWith(
        'PreToolUse',
        expect.objectContaining({
          tool: 'Write',
          parameters: { file_path: 'test.js', content: 'test' }
        })
      );

      expect(mockHookManager.fireHook).toHaveBeenCalledWith(
        'PostToolUse',
        expect.objectContaining({
          tool: 'Write',
          parameters: { file_path: 'test.js', content: 'test' },
          result: { success: true }
        })
      );
    });

    it('should handle multiple tool calls in sequence', async () => {
      const task = 'Read and edit a file';
      
      const readTool: ToolCall = {
        name: 'Read',
        parameters: { file_path: 'main.js' }
      };

      const editTool: ToolCall = {
        name: 'Edit',
        parameters: { 
          file_path: 'main.js',
          old_string: 'foo',
          new_string: 'bar'
        }
      };

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'I will read the file first',
          toolCalls: [readTool]
        })
        .mockResolvedValueOnce({
          content: 'Now I will edit the file',
          toolCalls: [editTool]
        })
        .mockResolvedValueOnce({
          content: 'File has been read and edited successfully.',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn()
        .mockResolvedValueOnce({ content: 'foo bar baz' })
        .mockResolvedValueOnce({ success: true });

      await masterLoop.executeTask(task);

      expect(mockToolManager.executeTool).toHaveBeenCalledTimes(2);
      expect(mockToolManager.executeTool).toHaveBeenNthCalledWith(1, 'Read', { file_path: 'main.js' });
      expect(mockToolManager.executeTool).toHaveBeenNthCalledWith(2, 'Edit', {
        file_path: 'main.js',
        old_string: 'foo',
        new_string: 'bar'
      });
    });

    it('should handle tool execution errors gracefully', async () => {
      const task = 'Read a non-existent file';
      
      const toolCall: ToolCall = {
        name: 'Read',
        parameters: { file_path: 'non-existent.js' }
      };

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'I will try to read the file',
          toolCalls: [toolCall]
        })
        .mockResolvedValueOnce({
          content: 'The file does not exist.',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn()
        .mockRejectedValue(new Error('File not found'));

      await masterLoop.executeTask(task);

      const history = masterLoop.getMessageHistory();
      const toolResult = history.find(msg => msg.role === 'tool');
      expect(toolResult).toBeDefined();
      expect(toolResult?.toolResults?.[0]).toMatchObject({
        error: expect.stringContaining('Failed to execute tool Read')
      });
    });
  });

  describe('executeQuery', () => {
    it('should execute a query and return the response', async () => {
      const query = 'What is the capital of France?';
      const response = 'The capital of France is Paris.';

      mockLLMClient.sendMessage = jest.fn().mockResolvedValue({
        content: response,
        toolCalls: []
      });

      const result = await masterLoop.executeQuery(query);

      expect(result).toBe(response);
      expect(masterLoop.getMessageHistory()).toHaveLength(2);
      expect(masterLoop.getMessageHistory()[0]).toEqual({
        role: 'user',
        content: query
      });
      expect(masterLoop.getMessageHistory()[1]).toEqual({
        role: 'assistant',
        content: response
      });
    });
  });

  describe('loop control', () => {
    it('should stop the loop when no more tool calls', async () => {
      const task = 'Simple task';

      mockLLMClient.sendMessage = jest.fn().mockResolvedValue({
        content: 'Task completed.',
        toolCalls: []
      });

      await masterLoop.executeTask(task);

      expect(mockLLMClient.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should continue looping while tool calls exist', async () => {
      const task = 'Complex task';

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'Starting task',
          toolCalls: [{ name: 'Tool1', parameters: {} }]
        })
        .mockResolvedValueOnce({
          content: 'Continuing task',
          toolCalls: [{ name: 'Tool2', parameters: {} }]
        })
        .mockResolvedValueOnce({
          content: 'Task completed',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn().mockResolvedValue({});

      await masterLoop.executeTask(task);

      expect(mockLLMClient.sendMessage).toHaveBeenCalledTimes(3);
      expect(mockToolManager.executeTool).toHaveBeenCalledTimes(2);
    });

    it('should be able to stop the loop manually', () => {
      masterLoop.stop();
      expect((masterLoop as any).isRunning).toBe(false);
    });
  });

  describe('message history management', () => {
    it('should maintain flat message history', async () => {
      const task = 'Test task';

      mockLLMClient.sendMessage = jest.fn()
        .mockResolvedValueOnce({
          content: 'Processing',
          toolCalls: [{ name: 'TestTool', parameters: {} }]
        })
        .mockResolvedValueOnce({
          content: 'Done',
          toolCalls: []
        });

      mockToolManager.executeTool = jest.fn().mockResolvedValue({ result: 'success' });

      await masterLoop.executeTask(task);

      const history = masterLoop.getMessageHistory();
      
      // Verify flat structure - no nested messages
      expect(history.every(msg => 
        ['user', 'assistant', 'tool', 'system'].includes(msg.role)
      )).toBe(true);
      
      // Verify order: user -> assistant -> tool -> assistant
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('tool');
      expect(history[3].role).toBe('assistant');
    });

    it('should be able to clear message history', () => {
      // Add some messages
      (masterLoop as any).messageHistory = [
        { role: 'user', content: 'test' },
        { role: 'assistant', content: 'response' }
      ];

      masterLoop.clearHistory();
      
      expect(masterLoop.getMessageHistory()).toEqual([]);
    });
  });
});