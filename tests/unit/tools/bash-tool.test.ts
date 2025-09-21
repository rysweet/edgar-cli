import { BashTool } from '../../../src/tools/bash-tool';
import { execSync, spawn } from 'child_process';
import * as path from 'path';

jest.mock('child_process');

describe('BashTool', () => {
  let bashTool: BashTool;
  let mockExecSync: jest.MockedFunction<typeof execSync>;
  let mockSpawn: jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    bashTool = new BashTool();
    mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    jest.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(bashTool.name).toBe('Bash');
      expect(bashTool.description.toLowerCase()).toContain('bash');
      expect(bashTool.description.toLowerCase()).toContain('command');
    });

    it('should define correct parameters', () => {
      const definition = bashTool.getDefinition();
      
      expect(definition.name).toBe('Bash');
      expect(definition.parameters.type).toBe('object');
      expect(definition.parameters.properties).toHaveProperty('command');
      expect(definition.parameters.properties).toHaveProperty('timeout');
      expect(definition.parameters.properties).toHaveProperty('working_directory');
      expect(definition.parameters.properties).toHaveProperty('run_in_background');
      expect(definition.parameters.required).toContain('command');
    });
  });

  describe('execute', () => {
    it('should execute a simple command', async () => {
      const command = 'echo "Hello, World!"';
      const output = 'Hello, World!\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(mockExecSync).toHaveBeenCalledWith(command, expect.objectContaining({
        encoding: 'utf-8',
        timeout: 120000,
        maxBuffer: 30000,
        cwd: process.cwd()
      }));
      expect(result.success).toBe(true);
      expect(result.output).toBe(output);
      expect(result.exitCode).toBe(0);
    });

    it('should respect custom timeout', async () => {
      const command = 'sleep 1';
      const timeout = 5000;
      
      mockExecSync.mockReturnValue(Buffer.from(''));

      await bashTool.execute({ command, timeout });

      expect(mockExecSync).toHaveBeenCalledWith(command, expect.objectContaining({
        timeout: 5000
      }));
    });

    it('should enforce maximum timeout of 10 minutes', async () => {
      const command = 'long-running-command';
      const timeout = 700000; // > 600000 (10 minutes)
      
      mockExecSync.mockReturnValue(Buffer.from(''));

      await bashTool.execute({ command, timeout });

      expect(mockExecSync).toHaveBeenCalledWith(command, expect.objectContaining({
        timeout: 600000 // Should be capped at 10 minutes
      }));
    });

    it('should change working directory if specified', async () => {
      const command = 'pwd';
      const working_directory = '/tmp';
      
      mockExecSync.mockReturnValue(Buffer.from('/tmp\n'));

      await bashTool.execute({ command, working_directory });

      expect(mockExecSync).toHaveBeenCalledWith(command, expect.objectContaining({
        cwd: '/tmp'
      }));
    });

    it('should handle command errors gracefully', async () => {
      const command = 'false'; // Command that exits with error
      
      mockExecSync.mockImplementation(() => {
        const error: any = new Error('Command failed');
        error.status = 1;
        error.stderr = Buffer.from('Error message');
        throw error;
      });

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Error message');
    });

    it('should handle timeout errors', async () => {
      const command = 'sleep 10';
      
      mockExecSync.mockImplementation(() => {
        const error: any = new Error('Command timed out');
        error.code = 'ETIMEDOUT';
        throw error;
      });

      const result = await bashTool.execute({ command, timeout: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should truncate output if too long', async () => {
      const command = 'generate-long-output';
      const longOutput = 'a'.repeat(35000);
      
      mockExecSync.mockReturnValue(Buffer.from(longOutput));

      const result = await bashTool.execute({ command });

      expect(result.output.length).toBeLessThanOrEqual(30020); // Allow for truncation message
      expect(result.truncated).toBe(true);
      expect(result.output).toContain('[Output truncated]');
    });

    it('should filter dangerous commands', async () => {
      const dangerousCommands = [
        'rm -rf /',
        'rm -rf /*',
        'dd if=/dev/zero of=/dev/sda',
        ':(){ :|:& };:', // Fork bomb
        'mkfs.ext4 /dev/sda',
      ];

      for (const command of dangerousCommands) {
        await expect(bashTool.execute({ command }))
          .rejects.toThrow('Command blocked for safety reasons');
      }
    });

    it('should block find and grep commands', async () => {
      const blockedCommands = [
        'find / -name "*.txt"',
        'grep -r "pattern" /',
        'find . -type f',
        'grep "search" file.txt'
      ];

      for (const command of blockedCommands) {
        await expect(bashTool.execute({ command }))
          .rejects.toThrow('Use the appropriate tool');
      }
    });

    it('should block file reading commands', async () => {
      const readCommands = [
        'cat file.txt',
        'head file.txt',
        'tail -f log.txt',
        'less file.txt',
        'more file.txt'
      ];

      for (const command of readCommands) {
        await expect(bashTool.execute({ command }))
          .rejects.toThrow('Use the Read tool');
      }
    });

    it('should handle pipes and redirections', async () => {
      const command = 'echo "test" | wc -l';
      const output = '1\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(true);
      expect(result.output).toBe(output);
    });

    it('should handle multiple commands with semicolon', async () => {
      const command = 'echo "first"; echo "second"';
      const output = 'first\nsecond\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(true);
      expect(result.output).toBe(output);
    });

    it('should handle && operator', async () => {
      const command = 'echo "first" && echo "second"';
      const output = 'first\nsecond\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(true);
      expect(result.output).toBe(output);
    });

    it('should validate required parameters', async () => {
      await expect(bashTool.execute({} as any))
        .rejects.toThrow('Missing required parameter: command');
    });

    it('should support background execution', async () => {
      const command = 'long-running-task';
      
      // Mock spawn for background execution
      const mockChild = {
        pid: 12345,
        unref: jest.fn()
      };
      mockSpawn.mockReturnValue(mockChild as any);

      const result = await bashTool.execute({ 
        command, 
        run_in_background: true 
      });

      expect(mockSpawn).toHaveBeenCalledWith(command, [], expect.objectContaining({
        shell: '/bin/bash',
        detached: true,
        stdio: 'ignore'
      }));
      expect(mockChild.unref).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.background).toBe(true);
      expect(result.message).toContain('background');
      expect(result.message).toContain('12345');
    });

    it('should provide command metadata', async () => {
      const command = 'ls -la';
      const output = 'file1.txt\nfile2.txt\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.command).toBe(command);
      expect(result.metadata.workingDirectory).toBe(process.cwd());
      expect(result.metadata.executedAt).toBeDefined();
    });

    it('should handle environment variables', async () => {
      const command = 'echo $TEST_VAR';
      process.env.TEST_VAR = 'test_value';
      
      mockExecSync.mockReturnValue(Buffer.from('test_value\n'));

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(true);
      expect(result.output).toContain('test_value');
      
      delete process.env.TEST_VAR;
    });

    it('should allow cd command with absolute paths', async () => {
      const command = 'cd /tmp && pwd';
      
      mockExecSync.mockReturnValue(Buffer.from('/tmp\n'));

      const result = await bashTool.execute({ command });

      expect(result.success).toBe(true);
      expect(result.output).toBe('/tmp\n');
    });

    it('should preserve quotes in commands', async () => {
      const command = 'echo "Hello World with spaces"';
      const output = 'Hello World with spaces\n';
      
      mockExecSync.mockReturnValue(Buffer.from(output));

      const result = await bashTool.execute({ command });

      expect(mockExecSync).toHaveBeenCalledWith(
        command, // Should preserve the quotes
        expect.any(Object)
      );
      expect(result.output).toBe(output);
    });
  });
});