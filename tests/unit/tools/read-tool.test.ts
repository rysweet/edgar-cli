import { ReadTool } from '../../../src/tools/read-tool';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra');

describe('ReadTool', () => {
  let readTool: ReadTool;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    readTool = new ReadTool();
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
  });

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(readTool.name).toBe('Read');
      expect(readTool.description).toBeDefined();
      expect(readTool.description).toContain('read');
    });

    it('should define correct parameters', () => {
      const definition = readTool.getDefinition();
      
      expect(definition.name).toBe('Read');
      expect(definition.parameters.type).toBe('object');
      expect(definition.parameters.properties).toHaveProperty('file_path');
      expect(definition.parameters.required).toContain('file_path');
    });

    it('should support optional line offset and limit', () => {
      const definition = readTool.getDefinition();
      
      expect(definition.parameters.properties).toHaveProperty('offset');
      expect(definition.parameters.properties).toHaveProperty('limit');
      expect(definition.parameters.required).not.toContain('offset');
      expect(definition.parameters.required).not.toContain('limit');
    });
  });

  describe('execute', () => {
    it('should read entire file when no offset/limit specified', async () => {
      const filePath = '/home/user/test.txt';
      const fileContent = 'Line 1\nLine 2\nLine 3';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ file_path: filePath });

      expect(mockFs.existsSync).toHaveBeenCalledWith(filePath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 2');
      expect(result.content).toContain('Line 3');
    });

    it('should format output with line numbers (cat -n style)', async () => {
      const filePath = '/home/user/test.txt';
      const fileContent = 'First line\nSecond line\nThird line';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ file_path: filePath });

      // Expect cat -n format with line numbers
      expect(result.content).toMatch(/^\s*1\s+First line/m);
      expect(result.content).toMatch(/^\s*2\s+Second line/m);
      expect(result.content).toMatch(/^\s*3\s+Third line/m);
    });

    it('should respect line limit', async () => {
      const filePath = '/home/user/large.txt';
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      const fileContent = lines.join('\n');
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ 
        file_path: filePath,
        limit: 10
      });

      const resultLines = result.content.split('\n').filter((line: string) => line.trim());
      expect(resultLines).toHaveLength(10);
      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 10');
      expect(result.content).not.toContain('Line 11');
    });

    it('should respect line offset', async () => {
      const filePath = '/home/user/test.txt';
      const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
      const fileContent = lines.join('\n');
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ 
        file_path: filePath,
        offset: 5,
        limit: 5
      });

      // Should start from line 5 (0-indexed)
      expect(result.content).toContain('Line 6');
      expect(result.content).toContain('Line 10');
      expect(result.content).not.toContain('Line 5');
      expect(result.content).not.toContain('Line 11');
    });

    it('should truncate long lines', async () => {
      const filePath = '/home/user/long.txt';
      const longLine = 'a'.repeat(3000);
      const fileContent = `Short line\n${longLine}\nAnother short line`;
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ file_path: filePath });

      // Lines longer than 2000 chars should be truncated
      const lines = result.content.split('\n');
      const truncatedLine = lines.find((line: string) => line.includes('a'.repeat(100)));
      
      expect(truncatedLine).toBeDefined();
      expect(truncatedLine!.length).toBeLessThanOrEqual(2050); // Account for line number + truncation
      expect(result.content).toContain('[truncated]');
    });

    it('should handle non-existent files gracefully', async () => {
      const filePath = '/home/user/non-existent.txt';
      
      mockFs.existsSync.mockReturnValue(false);

      await expect(readTool.execute({ file_path: filePath }))
        .rejects
        .toThrow('File not found');
    });

    it('should handle empty files', async () => {
      const filePath = '/home/user/empty.txt';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('');

      const result = await readTool.execute({ file_path: filePath });

      expect(result.content).toBe('[File is empty]');
    });

    it('should validate required parameters', async () => {
      await expect(readTool.execute({} as any))
        .rejects
        .toThrow('Missing required parameter: file_path');
    });

    it('should require absolute paths', async () => {
      const relativePath = './test.txt';
      
      await expect(readTool.execute({ file_path: relativePath }))
        .rejects
        .toThrow('File path must be absolute');
    });

    it('should handle binary files appropriately', async () => {
      const filePath = '/home/user/image.png';
      
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock binary detection
      const isBinary = jest.spyOn(readTool as any, 'isBinaryFile');
      isBinary.mockReturnValue(true);

      const result = await readTool.execute({ file_path: filePath });

      expect(result.content).toContain('[Binary file - cannot display as text]');
      expect(result.metadata).toEqual({
        isBinary: true,
        mimeType: 'image/png'
      });
    });

    it('should handle special file types (images, PDFs)', async () => {
      const imagePath = '/home/user/screenshot.jpg';
      
      mockFs.existsSync.mockReturnValue(true);
      
      const result = await readTool.execute({ file_path: imagePath });

      expect(result.metadata).toEqual({
        isImage: true,
        mimeType: 'image/jpeg'
      });
    });

    it('should read Jupyter notebooks (.ipynb)', async () => {
      const notebookPath = '/home/user/notebook.ipynb';
      const notebookContent = JSON.stringify({
        cells: [
          {
            cell_type: 'code',
            source: ['print("Hello")'],
            outputs: []
          },
          {
            cell_type: 'markdown',
            source: ['# Title']
          }
        ]
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(notebookContent);

      const result = await readTool.execute({ file_path: notebookPath });

      expect(result.content).toContain('print("Hello")');
      expect(result.content).toContain('# Title');
      expect(result.metadata).toEqual({
        isNotebook: true,
        cellCount: 2
      });
    });

    it('should handle file read errors', async () => {
      const filePath = '/home/user/protected.txt';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(readTool.execute({ file_path: filePath }))
        .rejects
        .toThrow('Permission denied');
    });

    it('should default to 2000 lines when limit not specified', async () => {
      const filePath = '/home/user/huge.txt';
      const lines = Array.from({ length: 5000 }, (_, i) => `Line ${i + 1}`);
      const fileContent = lines.join('\n');
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(fileContent);

      const result = await readTool.execute({ file_path: filePath });

      const resultLines = result.content.split('\n').filter((line: string) => line.trim());
      expect(resultLines.length).toBeLessThanOrEqual(2000);
      expect(result.metadata?.truncated).toBe(true);
      expect(result.metadata?.totalLines).toBe(5000);
    });
  });
});