module.exports = {
    forbidden: [
        {
            name: 'domain-no-framework',
            comment: 'Domain layer MUST NOT import framework modules',
            severity: 'error',
            from: { path: 'src/.*/domain/' },
            to: { path: ['@nestjs', '@prisma', 'node_modules'] }
        },
        {
            name: 'controllers-no-repositories',
            comment: 'Controllers MUST NOT talk to repositories directly (must go through services)',
            severity: 'error',
            from: { path: 'src/.*/controllers/.*\\.ts$' },
            to: { path: 'src/.*/repositories/.*\\.ts$' }
        },
        {
            name: 'dto-no-services',
            comment: 'DTOs MUST NOT import services or controllers',
            severity: 'error',
            from: { path: 'src/.*/dto/.*\\.ts$' },
            to: { path: ['.*/services/.*\\.ts$', '.*/controllers/.*\\.ts$'] }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules',
        },
        tsPreCompilationDeps: true,
    }
};
