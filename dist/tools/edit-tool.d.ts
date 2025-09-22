import { BaseTool, ToolDefinition } from './base-tool';
export interface EditToolParameters {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}
export interface EditToolResult {
    success: boolean;
    message: string;
    replacements: number;
    lineNumbers: number[];
    preview: {
        before: string;
        after: string;
    };
}
export declare class EditTool extends BaseTool {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(parameters: EditToolParameters): Promise<EditToolResult>;
    private countOccurrences;
    private replaceAll;
    private findLineNumbers;
    private createPreview;
}
//# sourceMappingURL=edit-tool.d.ts.map