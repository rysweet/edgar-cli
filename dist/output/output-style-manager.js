"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputStyleManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const output_style_1 = require("./output-style");
const path_utils_1 = require("../config/path-utils");
class OutputStyleManager {
    styles;
    activeStyle;
    configPath;
    formatter;
    constructor() {
        const configDir = (0, path_utils_1.getConfigDir)();
        this.configPath = path.join(configDir.projectPath, 'output-styles.yaml');
        this.styles = new Map();
        this.formatter = new output_style_1.OutputStyleFormatter();
        this.loadStyles();
    }
    loadStyles() {
        // Load default styles first
        output_style_1.DEFAULT_OUTPUT_STYLES.forEach((style, name) => {
            this.styles.set(name, style);
        });
        // Load custom styles from config file if it exists
        if (fs.existsSync(this.configPath)) {
            try {
                const content = fs.readFileSync(this.configPath, 'utf-8');
                const config = yaml.parse(content);
                if (config.styles) {
                    Object.entries(config.styles).forEach(([name, style]) => {
                        this.styles.set(name, style);
                    });
                }
                if (config.activeStyle) {
                    this.activeStyle = config.activeStyle;
                }
            }
            catch (error) {
                console.error(`Failed to load output styles: ${error.message}`);
            }
        }
    }
    saveStyles() {
        const config = {
            activeStyle: this.activeStyle,
            styles: this.styles
        };
        try {
            const dir = path.dirname(this.configPath);
            fs.ensureDirSync(dir);
            const content = yaml.stringify(config);
            fs.writeFileSync(this.configPath, content, 'utf-8');
        }
        catch (error) {
            console.error(`Failed to save output styles: ${error.message}`);
        }
    }
    addStyle(style) {
        this.styles.set(style.name, style);
        this.saveStyles();
    }
    removeStyle(name) {
        // Don't allow removing default styles
        if (output_style_1.DEFAULT_OUTPUT_STYLES.has(name)) {
            console.error(`Cannot remove default style: ${name}`);
            return false;
        }
        const result = this.styles.delete(name);
        if (result) {
            this.saveStyles();
        }
        return result;
    }
    getStyle(name) {
        return this.styles.get(name);
    }
    getAllStyles() {
        return new Map(this.styles);
    }
    setActiveStyle(name) {
        if (!this.styles.has(name)) {
            console.error(`Style not found: ${name}`);
            return false;
        }
        this.activeStyle = name;
        const style = this.styles.get(name);
        this.formatter.setStyle(style);
        this.saveStyles();
        return true;
    }
    getActiveStyle() {
        if (this.activeStyle) {
            return this.styles.get(this.activeStyle);
        }
        return output_style_1.DEFAULT_OUTPUT_STYLES.get('concise');
    }
    getFormatter() {
        return this.formatter;
    }
    createStyleFromTemplate(template, name, customizations) {
        const baseStyle = this.styles.get(template) || output_style_1.DEFAULT_OUTPUT_STYLES.get('concise');
        const newStyle = {
            ...baseStyle,
            name,
            ...customizations
        };
        this.addStyle(newStyle);
        return newStyle;
    }
    listStyles() {
        return Array.from(this.styles.keys());
    }
    exportStyle(name) {
        const style = this.styles.get(name);
        if (!style) {
            return undefined;
        }
        return yaml.stringify(style);
    }
    importStyle(yamlContent) {
        try {
            const style = yaml.parse(yamlContent);
            if (!style.name || !style.rules) {
                throw new Error('Invalid style format');
            }
            this.addStyle(style);
            return style;
        }
        catch (error) {
            console.error(`Failed to import style: ${error.message}`);
            return undefined;
        }
    }
}
exports.OutputStyleManager = OutputStyleManager;
//# sourceMappingURL=output-style-manager.js.map