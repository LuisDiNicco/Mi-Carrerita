const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src');

const replacements = {
    'é©': 'é',
    'é³': 'ó',
    'é±': 'ñ',
    'é­': 'í',
    'é¡': 'á',
    'éº': 'ú',
    'Ã©': 'é',
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'Ã­': 'í',
    'Ã¡': 'á',
    'Ãº': 'ú',
    'Â·': '·',
    'â˜…': '★',
    'ðŸ“š': '📚',
    'ðŸŒ²': '🌲',
    'ðŸ“…': '📅',
    'ðŸ“Š': '📊',
    'ðŸ †': '🏆',
    'âš ï¸': '⚠️'
};

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            walk(file);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(file, 'utf8');
            let changed = false;
            for (const [bad, good] of Object.entries(replacements)) {
                if (content.includes(bad)) {
                    content = content.replaceAll(bad, good);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(file, content, 'utf8');
                console.log('Fixed', file);
            }
        }
    });
}

walk(dir);
console.log('Done');
