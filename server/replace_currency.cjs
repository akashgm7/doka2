const fs = require('fs');
const path = require('path');

function replaceCurrency(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceCurrency(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('₹')) {
                content = content.replace(/₹/g, '$');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
            }
        }
    }
}

replaceCurrency(path.join(__dirname, '../src'));
console.log('Finished updating currency symbols.');
