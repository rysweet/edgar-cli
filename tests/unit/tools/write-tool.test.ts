import { WriteTool } from '../../../src/tools/write-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

jest.mock('fs-extra');

describe('WriteTool', () => {
  let writeTool: WriteTool;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    writeTool = new WriteTool();
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(writeTool.name).toBe('Write');
      expect(writeTool.description.toLowerCase()).toContain('write');
      expect(writeTool.description).toContain('file');
    });

    it('should define correct parameters', () => {
      const definition = writeTool.getDefinition();
      
      expect(definition.name).toBe('Write');
      expect(definition.parameters.type).toBe('object');
      expect(definition.parameters.properties).toHaveProperty('file_path');
      expect(definition.parameters.properties).toHaveProperty('content');
      expect(definition.parameters.required).toContain('file_path');
      expect(definition.parameters.required).toContain('content');
    });
  });

  describe('execute', () => {
    it('should write content to a new file', async () => {
      const filePath = '/home/user/new-file.txt';
      const content = 'Hello, World!';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.ensureDirSync).toHaveBeenCalledWith('/home/user');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
      expect(result.success).toBe(true);
      expect(result.message).toContain('created');
    });

    it('should overwrite an existing file', async () => {
      const filePath = '/home/user/existing.txt';
      const content = 'New content';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('Old content');
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
      expect(result.success).toBe(true);
      expect(result.message).toContain('overwritten');
      expect(result.previousContent).toBe('Old content');
    });

    it('should require absolute paths', async () => {
      const relativePath = './test.txt';
      
      await expect(writeTool.execute({ 
        file_path: relativePath, 
        content: 'test' 
      })).rejects.toThrow('File path must be absolute');
    });

    it('should validate required parameters', async () => {
      await expect(writeTool.execute({ file_path: '/test.txt' } as any))
        .rejects.toThrow('Missing required parameter: content');

      await expect(writeTool.execute({ content: 'test' } as any))
        .rejects.toThrow('Missing required parameter: file_path');
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = '/home/user/deep/nested/path/file.txt';
      const content = 'Content';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.ensureDirSync).toHaveBeenCalledWith('/home/user/deep/nested/path');
      expect(result.success).toBe(true);
    });

    it('should handle write errors gracefully', async () => {
      const filePath = '/home/user/protected.txt';
      const content = 'Content';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(writeTool.execute({ 
        file_path: filePath, 
        content: content 
      })).rejects.toThrow('Permission denied');
    });

    it('should preserve file permissions when overwriting', async () => {
      const filePath = '/home/user/script.sh';
      const content = '#!/bin/bash\necho "Hello"';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mode: 0o755 } as any);
      mockFs.readFileSync.mockReturnValue('Old script');
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.chmodSync).toHaveBeenCalledWith(filePath, 0o755);
      expect(result.success).toBe(true);
    });

    it('should handle empty content', async () => {
      const filePath = '/home/user/empty.txt';
      const content = '';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, '', 'utf-8');
      expect(result.success).toBe(true);
      expect(result.message).toContain('empty file');
    });

    it('should handle binary files', async () => {
      const filePath = '/home/user/data.bin';
      const content = Buffer.from([0x00, 0x01, 0x02, 0x03]).toString('base64');
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content,
        encoding: 'base64'
      } as any);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        Buffer.from(content, 'base64')
      );
      expect(result.success).toBe(true);
    });

    it('should track file statistics', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Test content';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(result.stats).toBeDefined();
      expect(result.stats.size).toBe(content.length);
      expect(result.stats.lines).toBe(1);
    });

    it('should handle multi-line content correctly', async () => {
      const filePath = '/home/user/multiline.txt';
      const content = 'Line 1\nLine 2\nLine 3';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(result.stats.lines).toBe(3);
      expect(result.success).toBe(true);
    });

    it('should not allow writing to system directories', async () => {
      const systemPaths = ['/etc/passwd', '/bin/sh', '/usr/bin/test'];
      
      for (const filePath of systemPaths) {
        await expect(writeTool.execute({ 
          file_path: filePath, 
          content: 'malicious' 
        })).rejects.toThrow('Cannot write to system directory');
      }
    });

    it('should handle special characters in file paths', async () => {
      const filePath = '/home/user/file with spaces.txt';
      const content = 'Content';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, content, 'utf-8');
      expect(result.success).toBe(true);
    });

    it('should return appropriate metadata', async () => {
      const filePath = '/home/user/test.py';
      const content = 'def hello():\n    print("Hello, World!")';
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.ensureDirSync.mockImplementation(() => {});
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await writeTool.execute({ 
        file_path: filePath, 
        content: content 
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata.extension).toBe('.py');
      expect(result.metadata.created).toBe(true);
    });
  });
});