const { AcademicCareerService } = require('./dist/modules/academic-career/services/academic-career.service.js');
const { EventEmitter2 } = require('@nestjs/event-emitter');

const mockPrismaService = {
    user: {
        findUnique: async () => ({ id: 'u1', email: 'test@e2e.com' }),
    },
    subject: {
        findMany: async () => ([
            {
                id: 's1',
                name: 'Álgebra',
                planCode: 'MAT01',
                year: 1,
                hours: 96,
                isOptional: false,
                prerequisites: [],
            },
        ]),
    },
    academicRecord: {
        findMany: async () => ([]),
    },
};

const service = new AcademicCareerService(mockPrismaService, new EventEmitter2());

async function run() {
    try {
        const res = await service.getCareerGraph('test@e2e.com');
        console.log("SUCCESS:", res);
    } catch (e) {
        require('fs').writeFileSync('error.txt', e.stack);
    }
}

run();
