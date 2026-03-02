const { execSync } = require('child_process');
try {
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    console.log('0 errors');
} catch (e) {
    console.log(e.stdout);
}
