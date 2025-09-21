import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { OutputStyle, OutputStyleConfig, DEFAULT_OUTPUT_STYLES, OutputStyleFormatter } from './output-style';
import { getConfigDir } from '../config/path-utils';

export class OutputStyleManager {
  private styles: Map<string, OutputStyle>;
  private activeStyle: string | undefined;
  private configPath: string;
  private formatter: OutputStyleFormatter;

  constructor() {
    const configDir = getConfigDir();
    this.configPath = path.join(configDir.projectPath, 'output-styles.yaml');
    this.styles = new Map();
    this.formatter = new OutputStyleFormatter();
    this.loadStyles();
  }

  private loadStyles(): void {
    // Load default styles first
    DEFAULT_OUTPUT_STYLES.forEach((style, name) => {
      this.styles.set(name, style);
    });

    // Load custom styles from config file if it exists
    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const config = yaml.parse(content) as OutputStyleConfig;
        
        if (config.styles) {
          Object.entries(config.styles).forEach(([name, style]) => {
            this.styles.set(name, style as OutputStyle);
          });
        }
        
        if (config.activeStyle) {
          this.activeStyle = config.activeStyle;
        }
      } catch (error: any) {
        console.error(`Failed to load output styles: ${error.message}`);
      }
    }
  }

  public saveStyles(): void {
    const config: OutputStyleConfig = {
      activeStyle: this.activeStyle,
      styles: this.styles
    };

    try {
      const dir = path.dirname(this.configPath);
      fs.ensureDirSync(dir);
      const content = yaml.stringify(config);
      fs.writeFileSync(this.configPath, content, 'utf-8');
    } catch (error: any) {
      console.error(`Failed to save output styles: ${error.message}`);
    }
  }

  public addStyle(style: OutputStyle): void {
    this.styles.set(style.name, style);
    this.saveStyles();
  }

  public removeStyle(name: string): boolean {
    // Don't allow removing default styles
    if (DEFAULT_OUTPUT_STYLES.has(name)) {
      console.error(`Cannot remove default style: ${name}`);
      return false;
    }
    
    const result = this.styles.delete(name);
    if (result) {
      this.saveStyles();
    }
    return result;
  }

  public getStyle(name: string): OutputStyle | undefined {
    return this.styles.get(name);
  }

  public getAllStyles(): Map<string, OutputStyle> {
    return new Map(this.styles);
  }

  public setActiveStyle(name: string): boolean {
    if (!this.styles.has(name)) {
      console.error(`Style not found: ${name}`);
      return false;
    }
    
    this.activeStyle = name;
    const style = this.styles.get(name)!;
    this.formatter.setStyle(style);
    this.saveStyles();
    return true;
  }

  public getActiveStyle(): OutputStyle | undefined {
    if (this.activeStyle) {
      return this.styles.get(this.activeStyle);
    }
    return DEFAULT_OUTPUT_STYLES.get('concise');
  }

  public getFormatter(): OutputStyleFormatter {
    return this.formatter;
  }

  public createStyleFromTemplate(template: string, name: string, customizations?: Partial<OutputStyle>): OutputStyle {
    const baseStyle = this.styles.get(template) || DEFAULT_OUTPUT_STYLES.get('concise')!;
    
    const newStyle: OutputStyle = {
      ...baseStyle,
      name,
      ...customizations
    };
    
    this.addStyle(newStyle);
    return newStyle;
  }

  public listStyles(): string[] {
    return Array.from(this.styles.keys());
  }

  public exportStyle(name: string): string | undefined {
    const style = this.styles.get(name);
    if (!style) {
      return undefined;
    }
    
    return yaml.stringify(style);
  }

  public importStyle(yamlContent: string): OutputStyle | undefined {
    try {
      const style = yaml.parse(yamlContent) as OutputStyle;
      if (!style.name || !style.rules) {
        throw new Error('Invalid style format');
      }
      
      this.addStyle(style);
      return style;
    } catch (error: any) {
      console.error(`Failed to import style: ${error.message}`);
      return undefined;
    }
  }
}