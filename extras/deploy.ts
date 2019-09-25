/*
* Deployment script for all the extras.
*/

import * as fs from 'fs';
import * as path from 'path';

const srcFolder = path.join(__dirname, '../deploy/extras/src');
const destFolder = path.join(__dirname, '../ext');

if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
}

fs.readdirSync(srcFolder).forEach(f => {
    if (f.endsWith('.d.ts') || f.endsWith('.js')) {
        const text = fs.readFileSync(path.join(srcFolder, f)).toString()
            .replace(/\.\.\/\.\.\/src/g, '\.\.\/dist\/src');
        fs.writeFileSync(path.join(destFolder, f), text);
    }
});
