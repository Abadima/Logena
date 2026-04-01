"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Logena=exports.default=void 0;const terminalColors={reset:"[0m",bright:"[1m",dim:"[2m",underscore:"[4m",blink:"[5m",reverse:"[7m",hidden:"[8m",textColors:{
// Standard ANSI 16 colors (backward compatible)
black:"[30m",brightBlue:"[94m",brightCyan:"[96m",brightGreen:"[92m",brightRed:"[91m",blue:"[34m",cyan:"[36m",gray:"[90m",green:"[32m",grey:"[90m",magenta:"[35m",pink:"[95m",red:"[31m",white:"[97m",yellow:"[33m",
// Extended ANSI 256-color variants (light/dark/rich shades)
lightGray:"[38;5;250m",darkGray:"[38;5;59m",lightRed:"[38;5;210m",darkRed:"[38;5;52m",lightGreen:"[38;5;157m",darkGreen:"[38;5;22m",lightBlue:"[38;5;117m",darkBlue:"[38;5;17m",lightCyan:"[38;5;159m",darkCyan:"[38;5;30m",lightMagenta:"[38;5;183m",darkMagenta:"[38;5;55m",lightYellow:"[38;5;227m",paleYellow:"[38;5;187m",orange:"[38;5;214m",lightOrange:"[38;5;216m",
// Additional useful variants
teal:"[38;5;36m",lime:"[38;5;82m",navy:"[38;5;18m",maroon:"[38;5;88m",plum:"[38;5;139m",olive:"[38;5;64m",coral:"[38;5;167m",salmon:"[38;5;173m",indigo:"[38;5;54m",violet:"[38;5;135m",khaki:"[38;5;185m",tan:"[38;5;180m",
// Semantic color names (intentional, composable)
success:"[38;5;82m",failure:"[38;5;167m",warning:"[38;5;214m",info:"[38;5;117m",debug:"[38;5;208m",muted:"[38;5;244m",accent:"[38;5;183m",emphasis:"[1m[38;5;227m"}};
// Numeric level map: single integer compare per log call eliminates all string ops on the hot path.
const LEVEL_MAP={debug:0,info:1,warn:2,error:3};
/**
 * Logger Class
 * @class Logena
 * @description A simple logger class that can be used to log messages to the console.
 * @example const logger = new Logger();
 * @example logger.set({ debug: true, appName: 'MyApp', useTimestamps: true });
 * @example logger.info('This is a log message');
 */class Logena{static defaultErrorCat=" /\\_/\\\n( o.o )\n > ^ <  meow!";static appName="";static colors={levels:{info:"blue",warn:"yellow",error:"red",debug:"cyan"}};static debugMode=false;static useTimestamps=false;static meowOnError=false;static errorCatAscii=Logena.defaultErrorCat;
// minLevel: numeric gate applied before argument parsing -- zero cost when at default (0 = debug).
static minLevel=0;
// noColor: strips all ANSI escape codes; useful for CI pipelines and file-based log sinks.
static noColor=false;
// serializeObjects: false emits type shorthands ([Object], [Array]) -- zero JSON parse cost.
static serializeObjects=true;static _prefixCache={info:"",warn:"",error:"",debug:""};static _levelPrefixCache={info:"",warn:"",error:"",debug:""};static _timestampColor="";static _appColorOpen="";static _appColorClose="";
// Cached reset code -- empty string when noColor is true, avoids branching inside formatMessage.
static _reset=terminalColors.reset;
// Per-second timestamp cache: avoids new Date().toISOString() (~1500 ns) on every log call.
static _cachedTimestamp="";static _cachedTimestampSec=-1;static parseLogArguments(args){if(args.length===2&&typeof args[1]==="string"&&(typeof args[0]==="string"||typeof args[0]==="object")){return{appName:args[1],messages:[args[0]]}}return{messages:args}}static stringifyPart(part){if(typeof part==="string")return part;
// Error instances: always emit stack (includes message) -- JSON.stringify drops the stack.
if(part instanceof Error)return part.stack??part.message;if(!this.serializeObjects){if(part===null)return"null";if(Array.isArray(part))return"[Array]";if(typeof part==="object")return"[Object]";return String(part)}try{return JSON.stringify(part)}catch{return String(part)}}static set(config){if(config.appName!==undefined)this.appName=config.appName;if(config.debug!==undefined)this.debugMode=config.debug;if(config.useTimestamps!==undefined)this.useTimestamps=config.useTimestamps;if(config.meowOnError!==undefined)this.meowOnError=config.meowOnError;if(config.errorCatAscii!==undefined){this.errorCatAscii=config.errorCatAscii.trim()?config.errorCatAscii:Logena.defaultErrorCat}if(config.minLevel!==undefined)this.minLevel=LEVEL_MAP[config.minLevel];if(config.noColor!==undefined)this.noColor=config.noColor;if(config.serializeObjects!==undefined)this.serializeObjects=config.serializeObjects;if(config.colors!==undefined){const c=config.colors;if(c.timestamp!==undefined)this.colors.timestamp=c.timestamp;if(c.appName!==undefined)this.colors.appName=c.appName;if(c.message!==undefined)this.colors.message=c.message;if(c.levels!==undefined){const l=c.levels;if(l.info!==undefined)this.colors.levels.info=l.info;if(l.warn!==undefined)this.colors.levels.warn=l.warn;if(l.error!==undefined)this.colors.levels.error=l.error;if(l.debug!==undefined)this.colors.levels.debug=l.debug}}this.rebuildCache()}static rebuildCache(){
// noColor path: emit ANSI-free plain text -- shorter strings, no escape code overhead in pipelines.
if(this.noColor){this._reset="";this._timestampColor="";this._appColorOpen="[ ";this._appColorClose=" ] ";const defaultAppPart=this.appName?`[ ${this.appName} ] `:"";const levels=["info","warn","error","debug"];for(const level of levels){const levelPrefix=`${level.toUpperCase()}: `;this._prefixCache[level]=`${defaultAppPart}${levelPrefix}`;this._levelPrefixCache[level]=levelPrefix}return}this._reset=terminalColors.reset;const reset=terminalColors.reset;const appNameColorKey=this.colors.appName??"white";const appNameColor=terminalColors.textColors[appNameColorKey]??terminalColors.textColors.white;const messageColorKey=this.colors.message??"white";const messageColor=terminalColors.textColors[messageColorKey]??terminalColors.textColors.white;const timestampColorKey=this.colors.timestamp??"white";this._timestampColor=terminalColors.textColors[timestampColorKey]??terminalColors.textColors.white;this._appColorOpen=`${appNameColor}[ `;this._appColorClose=` ]${reset} `;const defaultAppPart=this.appName?`${this._appColorOpen}${this.appName}${this._appColorClose}`:"";const levels=["info","warn","error","debug"];for(const level of levels){const levelColorKey=this.colors.levels[level];const levelColor=terminalColors.textColors[levelColorKey]??terminalColors.textColors.blue;const levelPrefix=`${levelColor}${level.toUpperCase()}${reset}: ${messageColor}`;this._prefixCache[level]=`${defaultAppPart}${levelPrefix}`;this._levelPrefixCache[level]=levelPrefix}}static _formatTimestamp(){
// Math.floor(Date.now() / 1000) costs ~50 ns but spares the ~1500 ns Date().toISOString() call
// when the second has not changed -- large net saving during log bursts in the same second.
const sec=Math.floor(Date.now()/1e3);if(sec!==this._cachedTimestampSec){const iso=(new Date).toISOString();this._cachedTimestamp=iso.slice(0,10)+" "+iso.slice(11,19)+"Z";this._cachedTimestampSec=sec}return this._cachedTimestamp}static formatMessage(level,messages,appName){const ts=this.useTimestamps?`${this._timestampColor}${this._formatTimestamp()}${this._reset} `:"";const prefix=appName?`${this._appColorOpen}${appName}${this._appColorClose}${this._levelPrefixCache[level]}`:this._prefixCache[level];const msg=messages.length===1?this.stringifyPart(messages[0]):messages.map(p=>this.stringifyPart(p)).join(" ");
// V8 compiles 4-operand template literals to optimized string concat -- no array allocation needed.
return`${ts}${prefix}${msg}${this._reset}`}
/**
     * Log an info message to the console
     * @param (...unknown[]) args - One or more values to log; supports legacy 2-arg appName override
     * @returns void
     */static info(...args){if(LEVEL_MAP.info<this.minLevel)return;const{appName,messages}=this.parseLogArguments(args);console.log(this.formatMessage("info",messages,appName))}
/**
     * Log a warning to the console
     * @param (...unknown[]) args - One or more values to log; supports legacy 2-arg appName override
     */static warn(...args){if(LEVEL_MAP.warn<this.minLevel)return;const{appName,messages}=this.parseLogArguments(args);console.warn(this.formatMessage("warn",messages,appName))}
/**
     * Log an error to the console
     * @param (...unknown[]) args - One or more values to log; supports legacy 2-arg appName override
     */static error(...args){if(LEVEL_MAP.error<this.minLevel)return;const{appName,messages}=this.parseLogArguments(args);if(this.meowOnError){console.error(this.errorCatAscii)}console.error(this.formatMessage("error",messages,appName))}
/**
     * Log a debug message to the console
     * @param (...unknown[]) args - One or more values to log; supports legacy 2-arg appName override
     */static debug(...args){
// debugMode guard first -- cheapest check; avoids minLevel compare in the common false case.
if(!this.debugMode)return;if(LEVEL_MAP.debug<this.minLevel)return;const{appName,messages}=this.parseLogArguments(args);console.debug(this.formatMessage("debug",messages,appName))}static{Logena.rebuildCache()}}exports.default=Logena;exports.Logena=Logena;