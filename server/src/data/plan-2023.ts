// server/src/data/plan-2023.ts

export type SubjectData = {
  planCode: string;
  name: string;
  semester: number;
  credits: number; 
  isOptional: boolean;
  correlativesFinal: string[];   // REQUISITO: Tener el FINAL aprobado de estas
  correlativesRegular: string[]; // REQUISITO: Tener la CURSADA (Regular) de estas
};

export const PLAN_2023: SubjectData[] = [
  // =======================================================
  // PRIMER AÑO
  // =======================================================
  
  // --- 1ER CUATRIMESTRE (Sin correlativas) ---
  { planCode: '3621', name: 'Matemática Discreta', semester: 1, credits: 4, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3622', name: 'Análisis Matemático 1', semester: 1, credits: 8, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3623', name: 'Programación Inicial', semester: 1, credits: 8, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3624', name: 'Intro. a los Sist. de Información', semester: 1, credits: 4, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3625', name: 'Sistemas de Numeración', semester: 1, credits: 4, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3626', name: 'Principios de Calidad de Sw', semester: 1, credits: 4, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '911', name: 'Computación Transversal I', semester: 1, credits: 2, isOptional: false, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '901', name: 'Inglés Transversal I', semester: 1, credits: 2, isOptional: false, correlativesFinal: [], correlativesRegular: [] },

  // --- 2DO CUATRIMESTRE ---
  { 
    planCode: '3627', name: 'Álgebra y Geometría Analítica 1', semester: 2, credits: 8, isOptional: false, 
    correlativesFinal: [], correlativesRegular: [] 
  },
  { 
    planCode: '3628', name: 'Física 1', semester: 2, credits: 8, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3622'] // Pide Análisis 1 (R)
  },
  { 
    planCode: '3629', name: 'Programación Estructurada Básica', semester: 2, credits: 8, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3623', '3625'] // Pide Prog Inicial (R) + Sist Num (R)
  },
  { 
    planCode: '3630', name: 'Intro. a la Gestión de Requisitos', semester: 2, credits: 4, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3624'] 
  },
  { 
    planCode: '3631', name: 'Fundamentos de Sist. Embebidos', semester: 2, credits: 4, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3625'] 
  },
  { 
    planCode: '3632', name: 'Intro. a los Proyectos Informáticos', semester: 2, credits: 4, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3624', '3626'] 
  },
  { 
    planCode: '912', name: 'Computación Transversal II', semester: 2, credits: 2, isOptional: false, 
    correlativesFinal: ['911'], correlativesRegular: [] // Final de Comp I
  },
  { 
    planCode: '902', name: 'Inglés Transversal II', semester: 2, credits: 2, isOptional: false, 
    correlativesFinal: ['901'], correlativesRegular: [] // Final de Inglés I
  },

  // =======================================================
  // SEGUNDO AÑO
  // =======================================================

  // --- 3ER CUATRIMESTRE ---
  { 
    planCode: '3633', name: 'Análisis Matemático 2', semester: 3, credits: 8, isOptional: false, 
    correlativesFinal: ['3622'], correlativesRegular: ['3627'] // Final AM1 + Reg Algebra1
  },
  { 
    planCode: '3634', name: 'Física 2', semester: 3, credits: 8, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3622', '3628'] // Reg AM1 + Reg Fisica1
  },
  { 
    planCode: '3635', name: 'Tópicos de Programación', semester: 3, credits: 4, isOptional: false, 
    correlativesFinal: ['3623'], correlativesRegular: ['3629'] // Final Prog Inicial + Reg Estructurada
  },
  { 
    planCode: '3636', name: 'Bases de Datos', semester: 3, credits: 6, isOptional: false, 
    correlativesFinal: ['3621', '3623'], correlativesRegular: [] // Final Discreta + Final Prog Inicial
  },
  { 
    planCode: '3637', name: 'Análisis de Sistemas', semester: 3, credits: 6, isOptional: false, 
    correlativesFinal: ['3624'], correlativesRegular: ['3630', '3629'] 
  },
  { 
    planCode: '3638', name: 'Arquitectura de Computadoras', semester: 3, credits: 6, isOptional: false, 
    correlativesFinal: ['3625'], correlativesRegular: ['3631'] 
  },
  { 
    planCode: '903', name: 'Inglés Transversal III', semester: 3, credits: 2, isOptional: false, 
    correlativesFinal: ['902'], correlativesRegular: [] 
  },

  // --- 4TO CUATRIMESTRE ---
  { 
    planCode: '3639', name: 'Análisis Matemático 3', semester: 4, credits: 4, isOptional: false, 
    correlativesFinal: ['3622', '3627'], correlativesRegular: ['3633'] // Final AM1, Alg1 + Reg AM2
  },
  { 
    planCode: '3640', name: 'Algoritmos y Estructuras de Datos', semester: 4, credits: 8, isOptional: false, 
    correlativesFinal: ['3623', '3621'], correlativesRegular: ['3629', '3635'] 
  },
  { 
    planCode: '3641', name: 'Bases de Datos Aplicada', semester: 4, credits: 6, isOptional: false, 
    correlativesFinal: ['3636'], correlativesRegular: [] // Final BD
  },
  { 
    planCode: '3642', name: 'Principios de Diseño de Sistemas', semester: 4, credits: 4, isOptional: false, 
    correlativesFinal: ['3624'], correlativesRegular: ['3637', '3636'] // Reg Analisis sist + BD
  },
  { 
    planCode: '3643', name: 'Redes de Computadoras', semester: 4, credits: 6, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3638'] // Reg Arqui
  },
  { 
    planCode: '3644', name: 'Gestión de las Organizaciones', semester: 4, credits: 4, isOptional: false, 
    correlativesFinal: [], correlativesRegular: ['3632'] 
  },
  { 
    planCode: '904', name: 'Inglés Transversal IV', semester: 4, credits: 2, isOptional: false, 
    correlativesFinal: ['903'], correlativesRegular: [] 
  },

  // =======================================================
  // TERCER AÑO
  // =======================================================

  // --- 5TO CUATRIMESTRE ---
  { 
    planCode: '3645', name: 'Álgebra y Geometría Analítica 2', semester: 5, credits: 4, isOptional: false, 
    correlativesFinal: ['3627'], correlativesRegular: [] 
  },
  { 
    planCode: '3646', name: 'Paradigmas de Programación', semester: 5, credits: 8, isOptional: false, 
    correlativesFinal: ['3629'], correlativesRegular: ['3640'] 
  },
  { 
    planCode: '3647', name: 'Requisitos Avanzados', semester: 5, credits: 4, isOptional: false, 
    correlativesFinal: ['3630', '3637'], correlativesRegular: [] 
  },
  { 
    planCode: '3648', name: 'Diseño de Software', semester: 5, credits: 6, isOptional: false, 
    correlativesFinal: ['3637'], correlativesRegular: ['3642', '3646'] 
  },
  { 
    planCode: '3649', name: 'Sistemas Operativos', semester: 5, credits: 6, isOptional: false, 
    correlativesFinal: ['3629', '3638'], correlativesRegular: [] 
  },
  { 
    planCode: '3650', name: 'Seguridad de la Información', semester: 5, credits: 4, isOptional: false, 
    correlativesFinal: ['3638', '3643'], correlativesRegular: [] 
  },

  // --- 6TO CUATRIMESTRE ---
  { 
    planCode: '3651', name: 'Probabilidad y Estadística', semester: 6, credits: 6, isOptional: false, 
    correlativesFinal: ['3622', '3627'], correlativesRegular: [] 
  },
  { 
    planCode: '3652', name: 'Programación Avanzada', semester: 6, credits: 8, isOptional: false, 
    correlativesFinal: ['3629', '3640'], correlativesRegular: ['3646'] 
  },
  { 
    planCode: '3653', name: 'Arquitectura de Sistemas Software', semester: 6, credits: 4, isOptional: false, 
    correlativesFinal: ['3642'], correlativesRegular: ['3648', '3643'] 
  },
  { 
    planCode: '3654', name: 'Virtualización de Hardware', semester: 6, credits: 4, isOptional: false, 
    correlativesFinal: ['3638'], correlativesRegular: ['3649', '3643'] 
  },
  { 
    planCode: '3655', name: 'Auditoría y Legislación', semester: 6, credits: 4, isOptional: false, 
    correlativesFinal: ['3650', '3644'], correlativesRegular: [] 
  },

  // =======================================================
  // CUARTO AÑO (MAYORES CAMBIOS SEGÚN PDF)
  // =======================================================

  // --- 7MO CUATRIMESTRE ---
  { 
    planCode: '3656', name: 'Estadística Aplicada', semester: 7, credits: 4, isOptional: false, 
    correlativesFinal: ['3651'], correlativesRegular: [] 
  },
  { 
    planCode: '3657', name: 'Autómatas y Gramática', semester: 7, credits: 4, isOptional: false, 
    correlativesFinal: ['3621', '3629'], correlativesRegular: [] // REF PDF: Pide Discreta y Estructurada
  },
  { 
    planCode: '3658', name: 'Programación Concurrente', semester: 7, credits: 4, isOptional: false, 
    correlativesFinal: ['3646', '3649'], correlativesRegular: [] 
  },
  { 
    planCode: '3659', name: 'Gestión Aplicada al Desarrollo Sw 1', semester: 7, credits: 4, isOptional: false, 
    correlativesFinal: ['3648'], correlativesRegular: ['3661'] 
  },
  { 
    planCode: '3660', name: 'Sistemas Operativos Avanzados', semester: 7, credits: 4, isOptional: false, 
    correlativesFinal: ['3649', '3643'], correlativesRegular: [] 
  },
  { 
    planCode: '3661', name: 'Gestión de Proyectos', semester: 7, credits: 6, isOptional: false, 
    correlativesFinal: ['3632', '3644'], correlativesRegular: [] 
  },

  // --- 8VO CUATRIMESTRE ---
  { 
    planCode: '3662', name: 'Matemática Aplicada', semester: 8, credits: 4, isOptional: false, 
    correlativesFinal: ['3651', '3633', '3645'], correlativesRegular: [] // REF PDF: Proba + AM2 + Alg2
  },
  { 
    planCode: '3663', name: 'Lenguajes y Compiladores', semester: 8, credits: 6, isOptional: false, 
    correlativesFinal: ['3646', '3657'], correlativesRegular: [] // REF PDF: Paradigmas + Automatas
  },
  { 
    planCode: '3664', name: 'Inteligencia Artificial', semester: 8, credits: 6, isOptional: false, 
    correlativesFinal: ['3651', '3621'], correlativesRegular: [] // REF PDF: Proba + Discreta
  },
  { 
    planCode: '3665', name: 'Gestión Aplicada al Desarrollo Sw 2', semester: 8, credits: 4, isOptional: false, 
    correlativesFinal: ['3648'], correlativesRegular: ['3659'] 
  },
  { 
    planCode: '3666', name: 'Seguridad Aplicada y Forensia', semester: 8, credits: 4, isOptional: false, 
    correlativesFinal: ['3650', '3649'], correlativesRegular: [] // REF PDF: Seguridad Info + Sist Operativos
  },
  { 
    planCode: '3667', name: 'Gestión de Calidad en Procesos', semester: 8, credits: 4, isOptional: false, 
    correlativesFinal: ['3626', '3648'], correlativesRegular: [] 
  },

  // =======================================================
  // QUINTO AÑO
  // =======================================================

  // --- 9NO CUATRIMESTRE ---
  { 
    planCode: '3668', name: 'Inteligencia Artificial Aplicada', semester: 9, credits: 4, isOptional: false, 
    correlativesFinal: ['3664'], correlativesRegular: [] 
  },
  { 
    planCode: '3669', name: 'Ciencia de Datos', semester: 9, credits: 4, isOptional: false, 
    correlativesFinal: ['3636', '3651'], correlativesRegular: [] 
  },
  { 
    planCode: '3670', name: 'Innovación y Emprendedorismo', semester: 9, credits: 4, isOptional: false, 
    correlativesFinal: ['3661'], correlativesRegular: [] // REF PDF: Pide Gestión de Proyectos
  },
  { 
    planCode: '3676', name: 'Responsabilidad Social Universitaria', semester: 9, credits: 0, isOptional: false, 
    correlativesFinal: [], correlativesRegular: [] 
  },
  
  // --- ELECTIVAS Y FINAL ---
  { planCode: '3672', name: 'Electiva 1', semester: 9, credits: 4, isOptional: true, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3673', name: 'Electiva 2', semester: 9, credits: 4, isOptional: true, correlativesFinal: [], correlativesRegular: [] },
  { planCode: '3674', name: 'Electiva 3', semester: 9, credits: 4, isOptional: true, correlativesFinal: [], correlativesRegular: [] },
  { 
    planCode: '3675', name: 'Práctica Profesional Supervisada', semester: 9, credits: 0, isOptional: false, 
    correlativesFinal: [], correlativesRegular: [] 
  },
  { 
    planCode: '3680', name: 'Taller de Integración', semester: 10, credits: 0, isOptional: true, 
    correlativesFinal: [], correlativesRegular: [] 
  },
  { 
    planCode: '3671', name: 'Proyecto Final de Carrera', semester: 10, credits: 10, isOptional: false, 
    correlativesFinal: ['3659', '3661', '3648'], correlativesRegular: [] 
  }
];