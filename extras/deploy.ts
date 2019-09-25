/*
* Manually deploys all the extras.
*/

import fs from 'fs';
import path from 'path';

const srcFolder = path.join(__dirname, 'src');
const destFolder = '../ext';

// Create destination folder, if it doesn't exist:
if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
}

fs.readdirSync(srcFolder).forEach(f => {
    if (f.endsWith('.d.ts') || f.endsWith('.js')) {
        const text = fs.readFileSync(path.join(srcFolder, f)).toString().replace(/\.\.\/\.\.\/src/g, '\.\.\/dist\/src');
        fs.writeFileSync(path.join(__dirname, destFolder, f), text);
    }
});
