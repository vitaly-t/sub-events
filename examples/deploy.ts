/*
* Manually deploys all the extras.
*/

import fs from 'fs';
import path from 'path';

const files = {
    source: ['from-emitter.ts', 'from-event.ts', 'from-interval.ts', 'from-timeout.ts'],
    aux: ['index.ts', 'tsconfig.json']
};

const destFolder = '../ext';

const srcInclude = /\.\.\/src/g;
const destInclude = '\.\.\/dist\/src';

// Create destination folder, if it doesn't exist:
if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
}

function copyFiles(files: string[], modifyText?: (txt: string) => string) {
    files.forEach(f => {
        let text = fs.readFileSync(f).toString();
        if (modifyText) {
            text = modifyText(text);
        }
        fs.writeFileSync(path.join(__dirname, destFolder, f), text);
    });
}

copyFiles(files.source, text => text.replace(srcInclude, destInclude));
copyFiles(files.aux);
