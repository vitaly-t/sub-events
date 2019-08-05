/**
 * This file is strictly for Browserify, to export everything,
 * if this library is used via JavaScript, and not TypeScript.
 *
 * This way, when used via TypeScript, extras can be discarded
 * by the tree-shaking logic when they are not used.
 */
export * from './';
import * as extras from './extras';

export {extras};
