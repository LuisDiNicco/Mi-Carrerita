const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('build')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const clientFiles = walk('c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src');
const serverFiles = walk('c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src');
const files = [...clientFiles, ...serverFiles];

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // 1. Fix hook production cast
    content = content.replace(/\(node\.data as any\)\.([a-zA-Z0-9_]+)/g, '(node.data as Record<string, unknown>).$1');
    content = content.replace(/\(edge\.data as any\)\?\./g, '(edge.data as Record<string, unknown>)?.');

    // 2. tests as jest.Mock
    content = content.replace(/\(academicApi\.fetchAcademicGraph as any\)/g, '(academicApi.fetchAcademicGraph as jest.Mock)');
    content = content.replace(/\(authApi\.authFetch as any\)/g, '(authApi.authFetch as jest.Mock)');
    content = content.replace(/setActiveSubject\(mockSubject as any\)/g, 'setActiveSubject(mockSubject as unknown as any)'); // fallback to allow compilation in test

    // 3. Backend typescript errors fixes:
    content = content.replace(/\(req as Record<string, unknown>\)\.correlationId = id/g, '(req as unknown as Record<string, unknown>).correlationId = id');
    content = content.replace(/\(request as Record<string, unknown>\)\.correlationId/g, '(request as unknown as Record<string, unknown>).correlationId');
    content = content.replace(/config\[key\] \|\| defaultValue/g, 'config[key as keyof typeof config] || defaultValue');
    content = content.replace(/mockUserTrophies: any\[\]/g, 'mockUserTrophies: unknown[]');

    // 4. useNodesState any
    content = content.replace(/useNodesState: \(initial: any\)/g, 'useNodesState: (initial: unknown)');
    content = content.replace(/useEdgesState: \(initial: any\)/g, 'useEdgesState: (initial: unknown)');

    // 5. Test ReactFlow mocks
    content = content.replace(/ReactFlow: \(props: any\)/g, 'ReactFlow: (props: { nodes: unknown[] })');
    content = content.replace(/props\.nodes\.map\(\(n: any\)/g, 'props.nodes.map((n: any)'); // leave it as any in map to avoid TS errors
    content = content.replace(/Panel: \(\{ children \}: any\)/g, 'Panel: ({ children }: { children: React.ReactNode })');

    // 6. fix dashboard test 
    content = content.replace(/\] as any;/g, '] as unknown as any[];');

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log(`Updated ${f}`);
    }
}
