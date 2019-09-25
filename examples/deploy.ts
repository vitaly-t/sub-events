/*
* Manually deploys all the extras.
*/

import fs from 'fs';
import path from 'path';

const srcFiles = ['index.ts', 'from-emitter.ts', 'from-event.ts', 'from-interval.ts', 'from-timeout.ts'];
const destFolder = '../ext';

const srcInclude = /\.\.\/src/g;
const destInclude = '\.\.\/dist\/src';

// Create destination folder, if it doesn't exist:
if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
}

srcFiles.forEach(f => {
    const text = fs.readFileSync(f).toString().replace(srcInclude, destInclude);
    fs.writeFileSync(path.join(__dirname, destFolder, f), text);
});
