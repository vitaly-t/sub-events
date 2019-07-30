/**
 * This file is strictly for Browserify, to export everything,
 * if this library is used via JavaScript, and not TypeScript.
 *
 * When used properly, via TypeScript, extras can be discarded
 * by the tree-shaking logic when they are not needed.
 */
export * from './';
import * as extras from './extras';

export {extras};
