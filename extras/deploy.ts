/*
* Deployment script for Extras.
*/

import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

const srcFolder = join(__dirname, '../deploy/extras/src');
const destFolder = join(__dirname, '../ext');

if (!existsSync(destFolder)) {
    mkdirSync(destFolder);
}

readdirSync(srcFolder).forEach(f => {
    if (f.endsWith('.d.ts') || f.endsWith('.js')) {
        const text = readFileSync(join(srcFolder, f)).toString()
            .replace(/\.\.\/\.\.\/src/g, '\.\.\/dist\/src');

        writeFileSync(join(destFolder, f), text);
    }
});
