import { OutputStyle, OutputStyleFormatter } from './output-style';
export declare class OutputStyleManager {
    private styles;
    private activeStyle;
    private configPath;
    private formatter;
    constructor();
    private loadStyles;
    saveStyles(): void;
    addStyle(style: OutputStyle): void;
    removeStyle(name: string): boolean;
    getStyle(name: string): OutputStyle | undefined;
    getAllStyles(): Map<string, OutputStyle>;
    setActiveStyle(name: string): boolean;
    getActiveStyle(): OutputStyle | undefined;
    getFormatter(): OutputStyleFormatter;
    createStyleFromTemplate(template: string, name: string, customizations?: Partial<OutputStyle>): OutputStyle;
    listStyles(): string[];
    exportStyle(name: string): string | undefined;
    importStyle(yamlContent: string): OutputStyle | undefined;
}
//# sourceMappingURL=output-style-manager.d.ts.map