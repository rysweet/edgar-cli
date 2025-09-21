import { EditTool } from '../../../src/tools/edit-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

jest.mock('fs-extra');

describe('EditTool', () => {
  let editTool: EditTool;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    editTool = new EditTool();
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(editTool.name).toBe('Edit');
      expect(editTool.description.toLowerCase()).toContain('edit');
      expect(editTool.description.toLowerCase()).toContain('replace');
    });

    it('should define correct parameters', () => {
      const definition = editTool.getDefinition();
      
      expect(definition.name).toBe('Edit');
      expect(definition.parameters.type).toBe('object');
      expect(definition.parameters.properties).toHaveProperty('file_path');
      expect(definition.parameters.properties).toHaveProperty('old_string');
      expect(definition.parameters.properties).toHaveProperty('new_string');
      expect(definition.parameters.properties).toHaveProperty('replace_all');
      expect(definition.parameters.required).toContain('file_path');
      expect(definition.parameters.required).toContain('old_string');
      expect(definition.parameters.required).toContain('new_string');
    });
  });

  describe('execute', () => {
    it('should replace first occurrence when string is unique', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Hello world.';
      const oldString = 'Hello';
      const newString = 'Hi';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        'Hi world.', 
        'utf-8'
      );
      expect(result.success).toBe(true);
      expect(result.replacements).toBe(1);
    });

    it('should replace all occurrences when replace_all is true', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Hello world. Hello again. Hello there.';
      const oldString = 'Hello';
      const newString = 'Hi';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString,
        replace_all: true
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        'Hi world. Hi again. Hi there.', 
        'utf-8'
      );
      expect(result.success).toBe(true);
      expect(result.replacements).toBe(3);
    });

    it('should fail if old_string is not found', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Hello world.';
      const oldString = 'Goodbye';
      const newString = 'Hi';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);

      await expect(editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      })).rejects.toThrow('String not found in file');
    });

    it('should fail if old_string is not unique and replace_all is false', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Hello world. Hello again.';
      const oldString = 'Hello';
      const newString = 'Hi';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);

      await expect(editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString,
        replace_all: false
      })).rejects.toThrow('String appears 2 times in file. Use replace_all or provide more context');
    });

    it('should handle multi-line replacements', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Line 1\nLine 2\nLine 3';
      const oldString = 'Line 2\nLine 3';
      const newString = 'New Line 2\nNew Line 3';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        'Line 1\nNew Line 2\nNew Line 3', 
        'utf-8'
      );
      expect(result.success).toBe(true);
    });

    it('should require absolute paths', async () => {
      await expect(editTool.execute({ 
        file_path: './test.txt', 
        old_string: 'old',
        new_string: 'new'
      })).rejects.toThrow('File path must be absolute');
    });

    it('should fail if file does not exist', async () => {
      const filePath = '/home/user/nonexistent.txt';
      
      mockFs.existsSync.mockReturnValue(false);

      await expect(editTool.execute({ 
        file_path: filePath, 
        old_string: 'old',
        new_string: 'new'
      })).rejects.toThrow('File not found');
    });

    it('should validate required parameters', async () => {
      await expect(editTool.execute({ 
        file_path: '/test.txt',
        old_string: 'old'
      } as any)).rejects.toThrow('Missing required parameter: new_string');

      await expect(editTool.execute({ 
        file_path: '/test.txt',
        new_string: 'new'
      } as any)).rejects.toThrow('Missing required parameter: old_string');
    });

    it('should preserve file permissions after edit', async () => {
      const filePath = '/home/user/script.sh';
      const content = '#!/bin/bash\necho "Hello"';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.statSync.mockReturnValue({ mode: 0o755 } as any);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.chmodSync.mockImplementation(() => {});

      await editTool.execute({ 
        file_path: filePath, 
        old_string: 'Hello',
        new_string: 'World'
      });

      expect(mockFs.chmodSync).toHaveBeenCalledWith(filePath, 0o755);
    });

    it('should handle special characters in search strings', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Price: $10.00 (tax included)';
      const oldString = '$10.00';
      const newString = '$15.00';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        'Price: $15.00 (tax included)', 
        'utf-8'
      );
      expect(result.success).toBe(true);
    });

    it('should handle empty new_string (deletion)', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Hello world';
      const oldString = ' world';
      const newString = '';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        filePath, 
        'Hello', 
        'utf-8'
      );
      expect(result.success).toBe(true);
    });

    it('should not allow old_string and new_string to be the same', async () => {
      const filePath = '/home/user/test.txt';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('content');

      await expect(editTool.execute({ 
        file_path: filePath, 
        old_string: 'same',
        new_string: 'same'
      })).rejects.toThrow('old_string and new_string cannot be the same');
    });

    it('should return line numbers where replacements occurred', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'Line 1\nLine 2 with foo\nLine 3\nLine 4 with foo';
      const oldString = 'foo';
      const newString = 'bar';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString,
        replace_all: true
      });

      expect(result.lineNumbers).toEqual([2, 4]);
      expect(result.replacements).toBe(2);
    });

    it('should handle very large files efficiently', async () => {
      const filePath = '/home/user/large.txt';
      const lines = Array(10000).fill('Line with pattern').join('\n');
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(lines);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: 'pattern',
        new_string: 'replacement',
        replace_all: true
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(10000);
    });

    it('should provide preview of changes', async () => {
      const filePath = '/home/user/test.txt';
      const content = 'The quick brown fox jumps over the lazy dog';
      const oldString = 'brown fox';
      const newString = 'red fox';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.statSync.mockReturnValue({ mode: 0o644 } as any);
      mockFs.chmodSync.mockImplementation(() => {});

      const result = await editTool.execute({ 
        file_path: filePath, 
        old_string: oldString,
        new_string: newString
      });

      expect(result.preview).toBeDefined();
      expect(result.preview.before).toContain('brown fox');
      expect(result.preview.after).toContain('red fox');
    });
  });
});