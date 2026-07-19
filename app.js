/* ═══ CONFIGURA ESTO: pega aquí la URL de tu Apps Script desplegado ═══ */
const API_URL = 'https://script.google.com/macros/s/AKfycbyQD0fFborghRu2-V8KbcsgoLM8AHqAGFVph_kVywkcOuPEx9evmKaDhplrx7xzcVTQ8g/exec';


/* ═══ FUSIÓN: datos y lógica de Flujo de Caja (del dashboard de Control de Proyectos) ═══
   PROJECTS es un snapshot estático (igual que en el dashboard original) — todavía no
   está conectado en vivo al Sheet de Proyectos. filteredProjects existe porque la
   lógica original soportaba filtros de Año/Mes/Encargado/Sector; por ahora, sin esos
   filtros en el portal, se usa el listado completo. ─── */
const PROJECTS=[
  {codigo:"C-25-001",cliente:"TERRANUM DESARROLLO S.A.S.",proyecto:"Terranum Connecta 80 Fase I",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:3,valor:853302118,liqSN:704370171,difCNpct:13.9,difSN:148931947,difSNpct:17.45,vContable:853302118,vPagado:828829130,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:-6,obs:""},
  {codigo:"C-25-002",cliente:"STF GROUP S.A.",proyecto:"ELA Mall Plaza NQS",estado:"Finalizado",sector:"Retail",ciudad:"Bogotá",encargado:"Camila Duran",cargo:"Directora de Proyectos",anio:2025,mes:3,valor:282086973,liqSN:214594440,difCNpct:23.78,difSN:67492532,difSNpct:23.93,vContable:284272231,vPagado:276153015,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:11,obs:""},
  {codigo:"C-25-003",cliente:"MARROQUINERA S.A.S.",proyecto:"Mario Hernandez Outlet Americas",estado:"Finalizado",sector:"Retail",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:7,valor:622685912,liqSN:539648050,difCNpct:8.46,difSN:83037862,difSNpct:13.34,vContable:654582318,vPagado:617750760,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:74,obs:""},
  {codigo:"C-25-004",cliente:"PLENTIA CAPITAL S.A.S",proyecto:"Dollarcity y Kokoriko Melgar",estado:"Finalizado",sector:"Retail",ciudad:"Melgar",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:11,valor:2885310099,liqSN:2354313273,difCNpct:16.1,difSN:530996826,difSNpct:18.4,vContable:2890298794,vPagado:2818159360,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:87,obs:""},
  {codigo:"C-25-005",cliente:"MAPFRE SEGUROS GENERALES DE COLOMBIA S.A",proyecto:"MAPFRE Auditorio CISMAP",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Camila Duran",cargo:"Directora de Proyectos",anio:2025,mes:5,valor:413631659,liqSN:325699504,difCNpct:14.18,difSN:87932155,difSNpct:21.26,vContable:413631659,vPagado:399763958,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-006",cliente:"COLTABACO SAS",proyecto:"Oficinas Coltabaco Medellín",estado:"Finalizado",sector:"Corporativo",ciudad:"Medellín",encargado:"Pablo Alfonso",cargo:"Director de Proyectos",anio:2025,mes:6,valor:1158277148,liqSN:994113100,difCNpct:11.36,difSN:164164048,difSNpct:14.17,vContable:1126598761,vPagado:1073657509,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:16,obs:""},
  {codigo:"C-25-008",cliente:"SURAMERICANA COMERCIAL SAS",proyecto:"Dollarcity CC Centro Chía",estado:"Finalizado",sector:"Retail",ciudad:"Chia",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:6,valor:462456448,liqSN:328573576,difCNpct:24.09,difSN:133882872,difSNpct:28.95,vContable:462456448,vPagado:452735113,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:1,obs:""},
  {codigo:"C-25-009",cliente:"MONTECITO SAS",proyecto:"Diseño Isla Morada",estado:"Finalizado",sector:"Diseño",ciudad:"Sopo Cundinamarca",encargado:"Sofia Granados",cargo:"Directora Creativa",anio:2025,mes:6,valor:49313600,liqSN:29588160,difCNpct:20,difSN:19725440,difSNpct:40,vContable:49313600,vPagado:35538944,pxCobrar:9862720,pxFacturar:0,avObra:100,avLiq:100,dias:12,obs:""},
  {codigo:"C-25-010",cliente:"PAULA MORENO",proyecto:"Apto Paula Moreno",estado:"Finalizado",sector:"Vivienda",ciudad:"Bogotá",encargado:"Pablo Alfonso",cargo:"Director de Proyectos",anio:2025,mes:7,valor:285273513,liqSN:236375378,difCNpct:8.01,difSN:48898135,difSNpct:17.14,vContable:276494997,vPagado:276494997,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-011",cliente:"MAPFRE SEGUROS GENERALES DE COLOMBIA S.A",proyecto:"Diseño Fachada MAPFRE",estado:"Finalizado",sector:"Diseño",ciudad:"Bogotá",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:2025,mes:7,valor:11755200,liqSN:7053120,difCNpct:20,difSN:4702080,difSNpct:40,vContable:13988688,vPagado:1331761,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-012",cliente:"CENTRO DE SISTEMAS DE ANTIOQUIA S.A.S.",proyecto:"HQ La Playa Medellín",estado:"Finalizado",sector:"Corporativo",ciudad:"Medellín",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:7,valor:2688116673,liqSN:2077685962,difCNpct:21.65,difSN:610430711,difSNpct:22.71,vContable:2688116673,vPagado:2637496826,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-013",cliente:"C3 CONSTRUCCIONES Y CONTRATOS SAS",proyecto:"Rediseño Edificio Vatia",estado:"Finalizado",sector:"Diseño",ciudad:"Cali",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:2025,mes:7,valor:20964230,liqSN:12578538,difCNpct:20,difSN:8385692,difSNpct:40,vContable:20964230,vPagado:7348686,pxCobrar:12578537,pxFacturar:12578538,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-014",cliente:"BANCOLOMBIA SA",proyecto:"Bancolombia Carrera 8",estado:"Finalizado",sector:"Bancario",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2025,mes:7,valor:357552489,liqSN:284680858,difCNpct:16.18,difSN:72871631,difSNpct:20.38,vContable:357552489,vPagado:347380278,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-015",cliente:"INVERSIONES VALENCIA ASOCIADOS SAS",proyecto:"Café SOCA CC Multiplaza Bogotá",estado:"Finalizado",sector:"Retail",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:7,valor:321055308,liqSN:272897012,difCNpct:15,difSN:48158296,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-016",cliente:"PRODUCTORA Y COMERCIALIZADORA DE ALIMENTOS S.A.S",proyecto:"MIMOS",estado:"Finalizado",sector:"Retail",ciudad:"Bucaramanga",encargado:"Otro",cargo:"Otro",anio:2025,mes:7,valor:50995138,liqSN:43345867,difCNpct:15,difSN:7649271,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-017",cliente:"AUTOFINANCIERA COLOMBIA S.A.",proyecto:"Diseño Arq. y Técnico Autofinanciera",estado:"Finalizado",sector:"Diseño",ciudad:"Bogotá",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:2025,mes:7,valor:20518575,liqSN:17440789,difCNpct:15,difSN:3077786,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-018",cliente:"INVERSIONES JMH SAS",proyecto:"Regus Santafé Drywall y Pintura",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Harold Gonzales",cargo:"Director de Proyectos",anio:2025,mes:7,valor:611601984,liqSN:519861686,difCNpct:15,difSN:91740298,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-019",cliente:"CBRE COLOMBIA SAS",proyecto:"GSK Adecuaciones Internas Oficinas",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Pablo Alfonso",cargo:"Director de Proyectos",anio:2025,mes:7,valor:437875784,liqSN:372194416,difCNpct:15,difSN:65681368,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-023",cliente:"REGUS COLOMBIA LIMITADA",proyecto:"Regus Calle 90 Urban Plaza",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2025,mes:8,valor:149059293,liqSN:126700399,difCNpct:15,difSN:22358894,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-024",cliente:"MAPFRE SEGUROS GENERALES DE COLOMBIA S.A",proyecto:"Adecuaciones Eléctricas Auditorio CISMAP",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2025,mes:8,valor:10393063,liqSN:8834104,difCNpct:15,difSN:1558959,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-025",cliente:"TERRANUM DESARROLLO S.A.S.",proyecto:"Terranum Connecta 80 Fase III",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2025,mes:8,valor:430312650,liqSN:365765752,difCNpct:15,difSN:64546898,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-026",cliente:"SURAMERICANA COMERCIAL SAS",proyecto:"Tienda Dollarcity Melgar",estado:"Finalizado",sector:"Retail",ciudad:"Melgar",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2025,mes:8,valor:510808056,liqSN:434186848,difCNpct:15,difSN:76621208,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-027",cliente:"COLEGIO MAYOR DE NUESTRA SEÑORA DEL ROSARIO",proyecto:"U. Rosario - Los Ángeles",estado:"En Liquidación",sector:"Obra Civil",ciudad:"Bogotá",encargado:"Harold Gonzales",cargo:"Director de Proyectos",anio:2026,mes:5,valor:1064013371,liqSN:737697500,difCNpct:20.69,difSN:326315871,difSNpct:30.67,vContable:1030897725,vPagado:879248508,pxCobrar:117981868,pxFacturar:0,avObra:100,avLiq:100,dias:95,obs:""},
  {codigo:"C-25-028",cliente:"REGUS COLOMBIA LIMITADA",proyecto:"Adecuaciones Edificio QBO",estado:"Finalizado",sector:"Facilities",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2026,mes:5,valor:8889300,liqSN:7555905,difCNpct:15,difSN:1333395,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-029",cliente:"REGUS COLOMBIA LIMITADA",proyecto:"Adecuaciones Oficinas Conecta 80",estado:"Finalizado",sector:"Facilities",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2026,mes:5,valor:26230080,liqSN:22295568,difCNpct:15,difSN:3934512,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-030",cliente:"SURAMERICANA COMERCIAL S.A.S.",proyecto:"Tienda Dollarcity Nomad Salitre",estado:"Finalizado",sector:"Retail",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:5,valor:652610311,liqSN:554718764,difCNpct:15,difSN:97891547,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-031",cliente:"INVERSIONES VALENCIA ASOCIADOS S.A.S.",proyecto:"Café SOCA Héroes",estado:"Finalizado",sector:"Retail",ciudad:"Bogotá",encargado:"Harold Gonzales",cargo:"Director de Proyectos",anio:2026,mes:5,valor:358227930,liqSN:304493740,difCNpct:15,difSN:53734190,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-032",cliente:"OFICINAS MULTIPLIKA - FACILITIES",proyecto:"PEI",estado:"En Ejecución",sector:"Facilities",ciudad:"Bogotá",encargado:"Juan Gabriel Pachon",cargo:"Coordinador de Facilities",anio:2026,mes:5,valor:41412000,liqSN:35200200,difCNpct:15,difSN:6211800,difSNpct:15,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-033",cliente:"MAPFRE SEGUROS GENERALES DE COLOMBIA S.A",proyecto:"MAPFRE Fachada Morato",estado:"En Liquidación",sector:"Otros",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2026,mes:3,valor:1648760133,liqSN:1188732751,difCNpct:25.42,difSN:460027382,difSNpct:27.9,vContable:1752846977,vPagado:1182204605,pxCobrar:513687298,pxFacturar:245263186,avObra:0,avLiq:0,dias:88,obs:""},
  {codigo:"C-25-035",cliente:"CARLOS NIETO",proyecto:"Carlos Nieto - Cr 19",estado:"En Liquidación",sector:"Retail",ciudad:"Bogotá",encargado:"Alejandro Pacheco",cargo:"Director de Proyectos",anio:2026,mes:4,valor:822522648,liqSN:698914882,difCNpct:10.68,difSN:123607766,difSNpct:15.03,vContable:980580718,vPagado:774758368,pxCobrar:177253184,pxFacturar:98058070,avObra:0,avLiq:0,dias:54,obs:""},
  {codigo:"C-25-036",cliente:"REGUS COLOMBIA LIMITADA",proyecto:"Regus Urban Plaza Fase 3 Calle 90",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Gabriel Vinasco",cargo:"Director de Facilities",anio:2026,mes:4,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-037",cliente:"TERRANUM DESARROLLO S.A.S.",proyecto:"Acabados BTS 3 Piso 3 Connecta Calle 26",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2026,mes:4,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-004",cliente:"Marroquineria SAS",proyecto:"Mario Hernandez - Bulevar Niza",estado:"En Liquidación",sector:"Retail",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2026,mes:4,valor:666961943,liqSN:452106993,difCNpct:47.52,difSN:214854950,difSNpct:32.21,vContable:662305497,vPagado:450000000,pxCobrar:193331329,pxFacturar:61020944,avObra:100,avLiq:100,dias:2,obs:""},
  {codigo:"C-26-005",cliente:"Frisby S.A BIC",proyecto:"Frisby Terminal de Carga",estado:"En Liquidación",sector:"Hospitality",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:3,valor:59380860,liqSN:41739581,difCNpct:42.27,difSN:17641279,difSNpct:29.71,vContable:59380860,vPagado:28833353,pxCobrar:29690430,pxFacturar:29690430,avObra:100,avLiq:95,dias:-2,obs:""},
  {codigo:"C-26-006",cliente:"Hoteles Estelar S.A",proyecto:"Intercontinental - Fase 1",estado:"En Ejecución",sector:"Hospitality",ciudad:"Cali",encargado:"Luis Mantilla",cargo:"Director Senior Proyectos",anio:2026,mes:7,valor:1776819100,liqSN:1439223471,difCNpct:23.46,difSN:337595629,difSNpct:19,vContable:10920592080,vPagado:953911380,pxCobrar:9962633377,pxFacturar:10729370729,avObra:40,avLiq:20,dias:29,obs:""},
  {codigo:"C-26-007",cliente:"Marroquineria SAS",proyecto:"Mario Hernandez - Av Chile",estado:"Garantias",sector:"Retail",ciudad:"Bogotá",encargado:"Alejandro Pacheco",cargo:"Director de Proyectos",anio:2026,mes:5,valor:813215525,liqSN:469430759,difCNpct:73.23,difSN:313880136,difSNpct:38.6,vContable:838955150,vPagado:457000000,pxCobrar:361527768,pxFacturar:196184897,avObra:95,avLiq:70,dias:-7,obs:""},
  {codigo:"C-26-008",cliente:"Frisby S.A BIC",proyecto:"Frisby Pitalito",estado:"En Liquidación",sector:"Retail",ciudad:"Huila",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:4,valor:48726725,liqSN:39608896,difCNpct:23.02,difSN:9117829,difSNpct:18.71,vContable:48726725,vPagado:23682826,pxCobrar:24363364,pxFacturar:24363362,avObra:100,avLiq:95,dias:1,obs:""},
  {codigo:"C-26-009",cliente:"Grupo Ethus",proyecto:"IAE",estado:"En Ejecución",sector:"Corporativo",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:8,valor:4804104491,liqSN:3113878985,difCNpct:54.28,difSN:1638612173,difSNpct:34.11,vContable:4675657089,vPagado:1976330468,pxCobrar:2617580959,pxFacturar:1807922292,avObra:50,avLiq:50,dias:48,obs:""},
  {codigo:"C-26-011",cliente:"Grupo Ethus",proyecto:"Terraza Piso 17",estado:"Cerrado",sector:"Corporativo",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:8,valor:270088406,liqSN:218771609,difCNpct:23.46,difSN:51316797,difSNpct:19,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-013",cliente:"Grupo Ethus",proyecto:"Apartamento Bosheto",estado:"En Liquidación",sector:"Vivienda",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:5,valor:90670281,liqSN:67113619,difCNpct:35.1,difSN:18089404,difSNpct:19.95,vContable:90670281,vPagado:24427817,pxCobrar:64443789,pxFacturar:0,avObra:91,avLiq:70,dias:17,obs:""},
  {codigo:"C-26-012",cliente:"",proyecto:"Diseño Miniso Zona T",estado:"En Ejecución",sector:"Diseño",ciudad:"Bogota",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:null,mes:null,valor:72279648,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-014",cliente:"Conconcreto",proyecto:"Sala de Ventas Moderno",estado:"En Liquidación",sector:"Vivienda",ciudad:"Bogotá",encargado:"Alejandro Pacheco",cargo:"Director de Proyectos",anio:2026,mes:4,valor:107887129,liqSN:66439073,difCNpct:62.39,difSN:38590642,difSNpct:35.77,vContable:107887129,vPagado:28655986,pxCobrar:74374237,pxFacturar:0,avObra:100,avLiq:100,dias:-6,obs:""},
  {codigo:"C-26-016",cliente:"Hoteles Estelar S.A",proyecto:"Salones Hotel Inter",estado:"En Ejecución",sector:"Hospitality",ciudad:"Cali",encargado:"Luis Mantilla",cargo:"Director Senior Proyectos",anio:2026,mes:4,valor:383554989,liqSN:249310743,difCNpct:53.85,difSN:72875448,difSNpct:19,vContable:383554989,vPagado:190057923,pxCobrar:193497066,pxFacturar:383554989,avObra:30,avLiq:20,dias:-66,obs:""},
  {codigo:"C-26-017",cliente:"Inversiones Valencia Asociados S.A.S.",proyecto:"Centro de experiencia SOCA",estado:"En Liquidación",sector:"Retail",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:4,valor:30531551,liqSN:24730556,difCNpct:23.46,difSN:5800995,difSNpct:19,vContable:30531551,vPagado:10000000,pxCobrar:19923799,pxFacturar:6106310,avObra:90,avLiq:0,dias:-44,obs:""},
  {codigo:"C-26-019",cliente:"Grupo Ethus",proyecto:"Reparaciones locativas - Interaseo piso 11",estado:"En Liquidación",sector:"Corporativo",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:4,valor:71281334,liqSN:57737881,difCNpct:23.46,difSN:13543453,difSNpct:19,vContable:71281334,vPagado:0,pxCobrar:69168152,pxFacturar:0,avObra:85,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-020",cliente:"Aruma",proyecto:"Tienda Aruma Salitre",estado:"En Liquidación",sector:"Retail",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:6,valor:291201376,liqSN:235873115,difCNpct:23.46,difSN:55328261,difSNpct:19,vContable:291201381,vPagado:145600690,pxCobrar:145600691,pxFacturar:0,avObra:100,avLiq:90,dias:0,obs:""},
  {codigo:"C-26-021",cliente:"Mall Plaza",proyecto:"Paisajismo Mall plaza",estado:"En Ejecución",sector:"Hospitality",ciudad:"Cali",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:6,valor:218786945,liqSN:177217425,difCNpct:23.46,difSN:41569520,difSNpct:19,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-022",cliente:"Aruma",proyecto:"Acometida - Aruma Salitre",estado:"En Liquidación",sector:"Retail",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:6,valor:16357836,liqSN:13249847,difCNpct:23.46,difSN:3107989,difSNpct:19,vContable:16357836,vPagado:8178918,pxCobrar:8178918,pxFacturar:16357836,avObra:0,avLiq:5,dias:0,obs:""},
  {codigo:"C-26-023",cliente:"Andrea Cuervo",proyecto:"Apartamento 302",estado:"En Ejecución",sector:"Vivienda",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2026,mes:6,valor:160120045,liqSN:0,difCNpct:0,difSN:160120045,difSNpct:100,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:20,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-024",cliente:"Terranum",proyecto:"Terranum Cortezza",estado:"En Ejecución",sector:"Corporativo",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:6,valor:729945412,liqSN:474464518,difCNpct:53.85,difSN:138689628,difSNpct:19,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-025",cliente:"Zephire",proyecto:"Zephire",estado:"En Ejecución",sector:"Retail",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:6,valor:195751173,liqSN:127238262,difCNpct:53.85,difSN:39150235,difSNpct:20,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:-19,obs:""},
  {codigo:"C-26-026",cliente:"Sodimac",proyecto:"Pet Center",estado:"En Ejecución",sector:"Retail",ciudad:"Pereira",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:6,valor:1148231739,liqSN:803762217,difCNpct:42.86,difSN:183717078,difSNpct:16,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-027",cliente:"Cinepolis",proyecto:"Adecuaciones Baños Cinepolis Plaza Claro",estado:"Por Iniciar",sector:"Otros",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:6,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-038",cliente:"Colegio Mayor de Nuestra Señora del Rosario",proyecto:"Laboratorios Quinta Mutis",estado:"En Ejecución",sector:"Obra Civil",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:2026,mes:7,valor:5252844579,liqSN:4088317501,difCNpct:28.48,difSN:480560804,difSNpct:9.15,vContable:4088317501,vPagado:0,pxCobrar:4088317501,pxFacturar:4088317501,avObra:55,avLiq:50,dias:0,obs:""},
  {codigo:"C-25-039",cliente:"COLTABACO SAS",proyecto:"Oficinas Coltabaco Bogota Edificio Naos",estado:"Finalizado",sector:"Corporativo",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-040",cliente:"GRUPO ETHUS",proyecto:"Edemsa Piso 16",estado:"Garantias",sector:"Corporativo",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:2,valor:2407596525,liqSN:1734299760,difCNpct:38.82,difSN:637579294,difSNpct:26.48,vContable:2139571912,vPagado:1402406701,pxCobrar:939710386,pxFacturar:271293330,avObra:0,avLiq:0,dias:-3,obs:""},
  {codigo:"C-25-041",cliente:"ELÉCTRICAS DE MEDELLÍN - INGENIERÍA Y SERVICIOS S.A.S. - EDEMSA",proyecto:"Diseño Oficinas Edemsa Medellin (grupo Ethuss)",estado:"En Liquidación",sector:"Diseño",ciudad:"Medellin",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:2025,mes:11,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:29,obs:""},
  {codigo:"C-25-042",cliente:"BRICKS S.A.S.",proyecto:"Diseño Oficina 812 Edifico Citibank (grupo Ethuss)",estado:"En Liquidación",sector:"Diseño",ciudad:"Bogotá",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-043",cliente:"MARROQUINERA S.A.S.",proyecto:"Carros de Personalizacion Mario Hernandez",estado:"En Liquidación",sector:"Otros",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-044",cliente:"MAPFRE SEGUROS GENERALES DE COLOMBIA S.A",proyecto:"Construccion Fachada Edificio 93",estado:"Finalizado",sector:"Otros",ciudad:"Bogotá",encargado:"Giovanny Velasquez",cargo:"Coordinador de Proyectos",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:100,avLiq:100,dias:0,obs:""},
  {codigo:"C-25-045",cliente:"REGUS COLOMBIA LIMITADA",proyecto:"Diseños Tecnicos Oficinas Nubank Piso 4 - Spaces 80/10",estado:"En Liquidación",sector:"Diseño",ciudad:"Bogotá",encargado:"Ricardo Ariza",cargo:"Director Ejecutivo Diseño",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-25-046",cliente:"REGUS COLOMBIA LTDA",proyecto:"Nubank Space 8011",estado:"En Liquidación",sector:"Corporativo",ciudad:"Bogotá",encargado:"Andres Rodriguez",cargo:"Director de Obras",anio:2026,mes:4,valor:2117089121,liqSN:1672500406,difCNpct:26.58,difSN:444588715,difSNpct:21,vContable:2117089031,vPagado:2114495031,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:54,obs:""},
  {codigo:"C-25-048",cliente:"GRUPO ETHUS",proyecto:"We Group",estado:"Garantias",sector:"Corporativo",ciudad:"Bogotá",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:3,valor:703499282,liqSN:622693841,difCNpct:12.98,difSN:80805441,difSNpct:11.49,vContable:688182995,vPagado:536704250,pxCobrar:131947632,pxFacturar:0,avObra:0,avLiq:0,dias:8,obs:""},
  {codigo:"C-26-010",cliente:"GRUPO ETHUS",proyecto:"Interaseo Piso 15",estado:"Cerrado",sector:"Corporativo",ciudad:"Medellin",encargado:"Jeison Cera",cargo:"Director de Obras",anio:2026,mes:8,valor:22772316,liqSN:9498095,difCNpct:139.76,difSN:6651679,difSNpct:29.21,vContable:13949867,vPagado:0,pxCobrar:13949867,pxFacturar:13949867,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-028",cliente:"GRUPO ETHUS",proyecto:"Diseño Terraza Piso 17",estado:"En Ejecución",sector:"Corporativo",ciudad:"",encargado:"Sin asignar",cargo:"",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-029",cliente:"GRUPO ETHUS",proyecto:"Diseño Piso 2",estado:"En Ejecución",sector:"Corporativo",ciudad:"",encargado:"Sin asignar",cargo:"",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-030",cliente:"GRUPO ETHUS",proyecto:"Diseños Arquitectonicos y Tecnicos Piso 15 - Interaseo",estado:"En Ejecución",sector:"Corporativo",ciudad:"",encargado:"Sin asignar",cargo:"",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""},
  {codigo:"C-26-031",cliente:"ANDREA CUERVO",proyecto:"Apto 302 - Calle 85 (mobiliario)",estado:"En Ejecución",sector:"Vivienda",ciudad:"",encargado:"Sin asignar",cargo:"",anio:null,mes:null,valor:0,liqSN:0,difCNpct:0,difSN:0,difSNpct:0,vContable:0,vPagado:0,pxCobrar:0,pxFacturar:0,avObra:0,avLiq:0,dias:0,obs:""}
];

const fmtMM=v=>{if(v===null||v===undefined||isNaN(v)||v===0)return"—";return"$"+Math.round(v).toLocaleString('es-CO');};

let filteredProjects = PROJECTS;

const PROJ_DETAIL={
  /* ── C-25-001: Terranum Connecta 80 Fase I ── datos reales Google Sheets */
  "C-25-001":{
    curvaS:[
      {s:"Sem 1",prog:5,real:1},{s:"Sem 2",prog:21,real:16},
      {s:"Sem 3",prog:46,real:42},{s:"Sem 4",prog:67,real:65},
      {s:"Sem 5",prog:83,real:80},{s:"Sem 6",prog:100,real:98},
      {s:"Sem 7",prog:100,real:100}
    ],
    capitulos:null
  },
  /* ── C-26-009: Oficinas IAE ── datos extraídos del informe PDF */
  "C-26-009":{
    curvaS:[
      {s:"Mar W1",prog:2,real:2},{s:"Mar W2",prog:5,real:4},{s:"Mar W3",prog:9,real:8},
      {s:"Abr W1",prog:14,real:13},{s:"Abr W2",prog:20,real:18},{s:"Abr W3",prog:27,real:25},
      {s:"Abr W4",prog:33,real:31},{s:"May W1",prog:39,real:37},{s:"May W2",prog:44,real:42},
      {s:"May W3",prog:50,real:48},{s:"May W4",prog:55,real:53},{s:"Jun W1",prog:60,real:57},
      {s:"Jun W2",prog:64,real:61},{s:"Jun W3",prog:67,real:63},{s:"Jun W4",prog:70,real:66}
    ],
    capitulos:[
      {cap:"Preliminares",prog:100,real:100},{cap:"Muros y Cielorasos",prog:100,real:95},
      {cap:"Voz y Datos",prog:68,real:61},{cap:"Audio y Video",prog:88,real:100},
      {cap:"Seguridad y Control",prog:68,real:50},{cap:"Mecánicas",prog:63,real:65},
      {cap:"Pisos y Enchapes",prog:100,real:93},{cap:"Pintura",prog:46,real:21},
      {cap:"Cielorasos Especiales",prog:78,real:58},{cap:"Sistemas Acústicos",prog:62,real:55},
      {cap:"Iluminación",prog:74,real:59},{cap:"Carpintería Alum.",prog:94,real:78}
    ]
  }
};

const CAPS = [
  {n:"CAP 01",nom:"Preliminares",ico:"🏗️",color:"#6b6b66",pct:0,monto:20000},
  {n:"CAP 02",nom:"Demoliciones",ico:"⚠️",color:"#c0392b",pct:0,monto:56000},
  {n:"CAP 03",nom:"Obra Civil",ico:"⭕",color:"#4a8fc0",pct:0,monto:131000},
  {n:"CAP 04",nom:"Muros",ico:"🧱",color:"#c08a00",pct:0,monto:131000},
  {n:"CAP 05",nom:"Cielos Rasos",ico:"📐",color:"#4a3aa7",pct:0,monto:162000},
  {n:"CAP 06",nom:"Pisos/Enchapes",ico:"▦",color:"#1a8a52",pct:0,monto:283000},
  {n:"CAP 07",nom:"Pintura",ico:"🎨",color:"#4a8fc0",pct:0,monto:81000},
  {n:"CAP 08",nom:"Carpintería",ico:"🪵",color:"#6b6b66",pct:0,monto:283000},
  {n:"CAP 09",nom:"Eléctrica",ico:"⚡",color:"#c08a00",pct:0,monto:131000},
  {n:"CAP 10",nom:"Iluminación",ico:"💡",color:"#c0392b",pct:0,monto:91000},
  {n:"CAP 11",nom:"HVAC",ico:"🌡️",color:"#1a8a52",pct:0,monto:81000},
  {n:"CAP 12",nom:"Hidro",ico:"💧",color:"#4a8fc0",pct:0,monto:35000},
  {n:"CAP 13",nom:"RCI",ico:"🚨",color:"#c0392b",pct:0,monto:56000},
  {n:"CAP 14",nom:"Diseño",ico:"✦",color:"#4a3aa7",pct:0,monto:111000},
  {n:"CAP 15",nom:"Varios",ico:"◆",color:"#e8622a",pct:0,monto:28000},
];



let FLUJO_CAJA=[];
const FLUJO_SHEET_ID='1CbTHrQqdji7HayP2XuVz_x-aJE4o4CGKq0zI1immtfM';
const FLUJO_SHEET_GID='327388996';
const FLUJO_CSV_URL=`https://docs.google.com/spreadsheets/d/${FLUJO_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${FLUJO_SHEET_GID}`;

function parseSheetCSV(text){
  const rows=[];let row=[];let field='';let inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){ if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else inQ=false; } else field+=c; }
    else { if(c==='"') inQ=true; else if(c===','){row.push(field);field='';} else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';} else if(c==='\r'){} else field+=c; }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows;
}
function parseMoneyCO(s){
  if(!s)return 0;
  const neg=s.indexOf('-')!==-1;
  const digits=s.replace(/[^0-9]/g,'');
  if(!digits)return 0;
  const n=parseInt(digits,10);
  return neg?-n:n;
}
function parsePctCO(s){
  if(!s)return 0;
  const n=parseFloat(s.replace('%','').replace(',','.').trim());
  return isNaN(n)?0:n;
}
function parseSemanaNum(s){
  if(!s)return null;
  const m=s.match(/Semana\s+(\d+)/i);
  return m?parseInt(m[1],10):null;
}
function isoFromSemanaNum(n){
  if(n==null)return null;
  const d=addDays(SEMANA1_INICIO,(n-1)*7);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
/* Columnas verificadas contra la hoja real (índices 0-based de la fila CSV) */
const FC_MILESTONE_SPECS=[
  {tipo:'Anticipo',label:null,pctIdx:8,valorProyIdx:10,fechaProyIdx:11,fechaRealIdx:12,valorRealIdx:13,fechaPresentaIdx:null,estadoIdx:14},
  {tipo:'Corte',label:'Corte 1',pctIdx:16,valorProyIdx:22,fechaPresentaIdx:23,fechaProyIdx:24,fechaRealIdx:25,valorRealIdx:26,estadoIdx:27},
  {tipo:'Corte',label:'Corte 2',pctIdx:29,valorProyIdx:35,fechaPresentaIdx:36,fechaProyIdx:37,fechaRealIdx:38,valorRealIdx:39,estadoIdx:40},
  {tipo:'Corte',label:'Corte 3',pctIdx:42,valorProyIdx:48,fechaPresentaIdx:49,fechaProyIdx:50,fechaRealIdx:51,valorRealIdx:52,estadoIdx:53},
  {tipo:'Corte',label:'Corte 4',pctIdx:55,valorProyIdx:61,fechaPresentaIdx:62,fechaProyIdx:63,fechaRealIdx:64,valorRealIdx:null,estadoIdx:65},
  {tipo:'Retegarantía',label:null,pctIdx:73,valorProyIdx:74,fechaProyIdx:75,fechaRealIdx:76,valorRealIdx:null,fechaPresentaIdx:null,estadoIdx:77},
  {tipo:'Liquidación',label:null,pctIdx:79,valorProyIdx:80,valorRealIdx:81,fechaPresentaIdx:82,fechaProyIdx:83,fechaRealIdx:83,estadoIdx:84},
];
function extractHito(row,spec){
  const pct=parsePctCO(row[spec.pctIdx]);
  const valorProy=spec.valorProyIdx!=null?parseMoneyCO(row[spec.valorProyIdx]):0;
  const valorReal=spec.valorRealIdx!=null?parseMoneyCO(row[spec.valorRealIdx]):0;
  const estadoRaw=(row[spec.estadoIdx]||'').trim();
  if(!(pct>0||valorProy>0||valorReal>0||estadoRaw!==''))return null;
  const estado=estadoRaw==='Confirmado'?'Confirmado':'Pendiente';
  const valor=valorReal>0?valorReal:valorProy;
  const semanaNumProy=spec.fechaProyIdx!=null?parseSemanaNum(row[spec.fechaProyIdx]):null;
  const semanaNumReal=spec.fechaRealIdx!=null?parseSemanaNum(row[spec.fechaRealIdx]):null;
  const semanaNumPresenta=spec.fechaPresentaIdx!=null?parseSemanaNum(row[spec.fechaPresentaIdx]):null;
  const semanaNum=semanaNumReal!=null?semanaNumReal:semanaNumProy;
  if(!(valor>0))return null;
  return{tipo:spec.tipo,label:spec.label||undefined,valor,
    semana:isoFromSemanaNum(semanaNum),
    semanaPresenta:isoFromSemanaNum(semanaNumPresenta),
    fecha:null,estado};
}
async function loadFlujoCajaLive(){
  const note=document.getElementById('fc-note');
  try{
    const res=await fetch(FLUJO_CSV_URL,{credentials:'omit'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const text=await res.text();
    const rows=parseSheetCSV(text);
    const dataRows=rows.slice(1).filter(r=>r[1]&&r[1].trim());
    const result=dataRows.map(row=>{
      const codigo=row[1].trim();
      const hitos=FC_MILESTONE_SPECS.map(spec=>extractHito(row,spec)).filter(Boolean);
      return{codigo,hitos};
    });
    FLUJO_CAJA.length=0;
    FLUJO_CAJA.push(...result);
    if(note)note.style.display='none';
  }catch(err){
    console.error('No se pudo cargar el Flujo de Caja en vivo desde el Google Sheet:',err);
    if(note){note.style.display='block';note.textContent='⚠ No se pudo conectar con el Google Sheet en vivo (revisa tu conexión o que el archivo siga compartido como "Cualquiera con el enlace"). El cuadro de flujo de caja puede estar incompleto.';}
  }
}
const TIPO_COLOR_FC={Anticipo:'#2e7dd1',Corte:'#1a8a52','Liquidación':'#e8622a','Retegarantía':'#a82c00',Vencido:'#c0392b'};
function mondayOf(d){const dt=new Date(d);const day=(dt.getDay()+6)%7;dt.setHours(0,0,0,0);dt.setDate(dt.getDate()-day);return dt;}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt;}
function fcShort(d){return d.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit'});}
function fcResolveDate(val,base){if(val==null)return null;if(typeof val==='number')return addDays(base,val);const d=new Date(val+'T00:00:00');return isNaN(d)?null:d;}
const SEMANA1_INICIO=new Date(2025,11,29);
function semanaNumOf(d){const diff=Math.round((mondayOf(d)-SEMANA1_INICIO)/(86400000*7));return diff+1;}

let fcSemanaChart,fcTipoChart,fcVencTipoChart;
let fcActiveWeek=0,fcR4Weeks=[],fcR4Rows=[];
function fcSelectWeek(i){fcActiveWeek=i;renderResumen4Semanas();}
function buildResumen4Semanas(weeks,rows){
  fcR4Weeks=weeks.slice(0,4);
  fcR4Rows=rows;
  if(fcActiveWeek>fcR4Weeks.length-1)fcActiveWeek=0;
  renderResumen4Semanas();
}
function esVencido(h,cutoff){
  const ingOverdue=h.semanaDate&&h.semanaDate<cutoff&&h.estado!=='Confirmado';
  const presOverdue=h.semanaPresentaDate&&h.semanaPresentaDate<cutoff&&h.estado!=='Confirmado';
  return ingOverdue||presOverdue;
}
function renderResumen4Semanas(){
  const weeks=fcR4Weeks,rows=fcR4Rows;
  if(!weeks.length)return;
  const cards=weeks.map((w,i)=>{
    const ingresar=rows.filter(h=>h.semanaDate&&h.semanaDate>=w.start&&h.semanaDate<=w.end).reduce((s,h)=>s+h.valor,0);
    const presentar=rows.filter(h=>h.semanaPresentaDate&&h.semanaPresentaDate>=w.start&&h.semanaPresentaDate<=w.end).reduce((s,h)=>s+h.valor,0);
    const totalSemana=ingresar+presentar;
    const esSemanaActual=i===0;
    const cardCls='fc-r4-card'+(i===fcActiveWeek?' active':'');
    return`<div class="${cardCls}" onclick="fcSelectWeek(${i})">
      <div class="fc-r4-wk">Semana ${semanaNumOf(w.start)}${esSemanaActual?' (actual)':''}</div>
      <div class="fc-r4-date">${fcShort(w.start)}–${fcShort(w.end)}</div>
      <div class="fc-r4-row"><span>A ingresar</span><span class="fc-r4-val ing">${fmtMM(ingresar)}</span></div>
      <div class="fc-r4-row"><span>A presentar</span><span class="fc-r4-val pres">${fmtMM(presentar)}</span></div>
      <div class="fc-r4-row total"><span>Total semana</span><span class="fc-r4-val total">${fmtMM(totalSemana)}</span></div>
    </div>`;
  }).join('');
  document.getElementById('fc-resumen4').innerHTML=cards;

  const w=weeks[fcActiveWeek];
  const ingRows=rows.filter(h=>h.semanaDate&&h.semanaDate>=w.start&&h.semanaDate<=w.end);
  const presRows=rows.filter(h=>h.semanaPresentaDate&&h.semanaPresentaDate>=w.start&&h.semanaPresentaDate<=w.end);
  const rowHtml=list=>list.length?list.map(h=>`<div class="fc-r4-row" style="border-bottom:1px solid #f5f3f0;padding:5px 0">
      <span><strong style="color:#1a1a1a">${h.proyecto}</strong> — ${h.label||h.tipo} <span class="ht ht-${h.tipo}" style="margin-left:4px">${h.tipo}</span></span>
      <span class="fc-r4-val" style="font-size:11px">${fmtMM(h.valor)}</span></div>`).join(''):
    '<div class="fc-r4-detail-empty">Nada programado esta semana.</div>';
  document.getElementById('fc-resumen4-detail').innerHTML=`
    <div class="fc-r4-detail-wrap">
      <div class="fc-r4-detail-title">A ingresar — Semana ${semanaNumOf(w.start)} (${fcShort(w.start)}–${fcShort(w.end)})</div>
      ${rowHtml(ingRows)}
      <div class="fc-r4-detail-title" style="margin-top:12px">A presentar — Semana ${semanaNumOf(w.start)} (${fcShort(w.start)}–${fcShort(w.end)})</div>
      ${rowHtml(presRows)}
    </div>`;
}
/* ── Panel independiente de Pagos Vencidos (no depende de la semana seleccionada) ── */
function diasAtraso(fecha,today0){
  if(!fecha)return null;
  return Math.max(0,Math.round((today0-fecha)/86400000));
}
/* Icono ✓/✗ para indicar si el hito ya fue presentado.
   Solo aplica a hitos con paso de presentación (Corte/Liquidación).
   ✓ verde: la fecha de presentación ya pasó (se dio por presentado).
   ✗ rojo: tiene fecha de presentación pero todavía no llega o sigue pendiente.
   — gris: el hito no requiere presentación (Anticipo/Retegarantía). */
function presentadoIcon(h,today0){
  if(!h.semanaPresentaDate)return'<span style="color:#c5c2bc">—</span>';
  return h.semanaPresentaDate<=today0
    ?'<span style="color:#1a8a52;font-weight:700;font-size:13px">✓</span>'
    :'<span style="color:#c0392b;font-weight:700;font-size:13px">✗</span>';
}
/* Icono ✓/✗ para el ingreso: ✓ solo si el estado del hito ya quedó Confirmado
   (el pago realmente entró). ✗ si tenía fecha de ingreso y sigue Pendiente. */
function ingresoIcon(h){
  if(!h.semanaDate)return'<span style="color:#c5c2bc">—</span>';
  return h.estado==='Confirmado'
    ?'<span style="color:#1a8a52;font-weight:700;font-size:13px">✓</span>'
    :'<span style="color:#c0392b;font-weight:700;font-size:13px">✗</span>';
}
function renderVencidos(vencidosList,today0){
  const total=vencidosList.reduce((s,h)=>s+h.valor,0);
  const sub=document.getElementById('fc-venc-sub');
  sub.textContent=vencidosList.length? `${vencidosList.length} hito(s) — ${fmtMM(total)} en total`:'Sin pagos vencidos';
  const sorted=[...vencidosList].sort((a,b)=>{
    const da=a.semanaDate||a.semanaPresentaDate||new Date(0);
    const db=b.semanaDate||b.semanaPresentaDate||new Date(0);
    return da-db;
  });
  document.getElementById('fc-vencidos-tbody').innerHTML=sorted.length?sorted.map(h=>{
    const diasIng=diasAtraso(h.semanaDate&&h.semanaDate<today0?h.semanaDate:null,today0);
    const diasPres=diasAtraso(h.semanaPresentaDate&&h.semanaPresentaDate<today0?h.semanaPresentaDate:null,today0);
    const dias=[diasIng,diasPres].filter(d=>d!==null);
    const diasMax=dias.length?Math.max(...dias):null;
    return`<tr class="fc-row-venc">
      <td class="td-primary">${h.proyecto}</td><td>${h.encargado||''}</td>
      <td><span class="ht ht-${h.tipo}">${h.label||h.tipo}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(h.valor)}</td>
      <td>${ingresoIcon(h)} ${h.semanaDate?fcShort(h.semanaDate)+(h.semanaDate<today0?' ⚠':''):'—'}</td>
      <td>${presentadoIcon(h,today0)} ${h.semanaPresentaDate?fcShort(h.semanaPresentaDate)+(h.semanaPresentaDate<today0?' ⚠':''):'—'}</td>
      <td style="text-align:right;color:#c0392b;font-weight:600">${diasMax!==null?diasMax+' días':'—'}</td>
      <td><span class="hb ${h.estado==='Confirmado'?'hb-cob':'hb-pend'}">${h.estado}</span></td></tr>`;
  }).join(''):
    '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px">No hay pagos vencidos con los filtros actuales</td></tr>';

  const vTipoTotals={Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0};
  vencidosList.forEach(h=>vTipoTotals[h.tipo]+=h.valor);
  const vLabelsAll=Object.keys(vTipoTotals);
  const vLabels=vLabelsAll.filter(l=>vTipoTotals[l]>0);
  const vData=vLabels.map(l=>vTipoTotals[l]);
  const vColors=vLabels.map(l=>TIPO_COLOR_FC[l]);
  if(fcVencTipoChart)fcVencTipoChart.destroy();
  const vencCanvas=document.getElementById('fcVencTipoChart');
  if(vencCanvas){
    fcVencTipoChart=new Chart(vencCanvas,{type:'doughnut',
      data:{labels:vLabels.length?vLabels:['Sin datos'],datasets:[{data:vLabels.length?vData:[1],backgroundColor:vLabels.length?vColors:['#e8e5e0'],borderWidth:6,borderColor:'#fff',borderRadius:8,spacing:4}]},
      options:{responsive:false,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{enabled:vLabels.length>0,callbacks:{label:c=>` ${c.label}: ${fmtMM(c.raw)}`}}}}});
  }
  const vDonutN=document.getElementById('fc-venc-donut-n');
  if(vDonutN)vDonutN.textContent=vencidosList.length;
  const vLegend=document.getElementById('fc-venc-tipo-legend');
  if(vLegend)vLegend.innerHTML=vLabels.length?vLabels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${vColors[i]}"></div><span>${l}</span><span class="legend-n">${fmtMM(vData[i])}</span></div>`).join(''):
    '<div style="font-size:11px;color:#aaa;text-align:center">Sin pagos vencidos</div>';
}
function buildFlujoCaja(){
  const codigosVisibles=new Set(filteredProjects.map(p=>p.codigo));
  const today0=mondayOf(new Date());
  const weeks=[...Array(12)].map((_,i)=>({start:addDays(today0,i*7),end:addDays(today0,i*7+6)}));
  const rows=[];
  FLUJO_CAJA.forEach(fc=>{
    const p=PROJECTS.find(x=>x.codigo===fc.codigo);
    if(!p||!codigosVisibles.has(fc.codigo))return;
    fc.hitos.forEach(h=>{
      rows.push({...h,codigo:fc.codigo,proyecto:p.proyecto,encargado:p.encargado,
        semanaDate:fcResolveDate(h.semana,today0),fechaDate:fcResolveDate(h.fecha,today0),
        semanaPresentaDate:fcResolveDate(h.semanaPresenta,today0)});
    });
  });

  buildResumen4Semanas(weeks,rows);

  const totalProyectado=rows.filter(h=>h.semanaDate&&h.semanaDate>=weeks[0].start&&h.semanaDate<=weeks[11].end).reduce((s,h)=>s+h.valor,0);
  const vencidos=rows.filter(h=>esVencido(h,weeks[0].start));
  const totalVencido=vencidos.reduce((s,h)=>s+h.valor,0);
  renderVencidos(vencidos,today0);
  const totalPendiente=rows.filter(h=>h.estado==='Pendiente').reduce((s,h)=>s+h.valor,0);
  const totalGestionado=rows.filter(h=>h.estado==='Confirmado').reduce((s,h)=>s+h.valor,0);

  const sinHitos=FLUJO_CAJA.filter(fc=>codigosVisibles.has(fc.codigo)&&fc.hitos.length===0).length;
  const note=document.getElementById('fc-note');
  if(sinHitos>0){note.style.display='block';note.textContent=`⚠ ${sinHitos} proyecto(s) activos sin hitos programados todavía — complétalos en la pestaña "Flujo de Caja" del Google Sheet y regenera este archivo.`;}
  else note.style.display='none';

  document.getElementById('fc-kpi-strip').innerHTML=`
    <div class="kpi"><div class="kpi-ico total"><svg width="16" height="16" fill="none" stroke="#e8622a" stroke-width="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="9" x2="23" y2="9"/></svg></div>
      <div><div class="kpi-num">${fmtMM(totalProyectado)}</div><div class="kpi-lbl">Proyectado 12 semanas</div></div></div>
    <div class="kpi"><div class="kpi-ico venc"><svg width="16" height="16" fill="none" stroke="#c0392b" stroke-width="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg></div>
      <div><div class="kpi-num" style="color:#c0392b">${fmtMM(totalVencido)}</div><div class="kpi-lbl">Vencido sin presentar</div></div></div>
    <div class="kpi"><div class="kpi-ico liq"><svg width="16" height="16" fill="none" stroke="#a0620a" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div><div class="kpi-num" style="color:#a0620a">${fmtMM(totalPendiente)}</div><div class="kpi-lbl">Pendiente por presentar</div></div></div>
    <div class="kpi"><div class="kpi-ico ejec"><svg width="16" height="16" fill="none" stroke="#1a8a52" stroke-width="1.8" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div><div class="kpi-num" style="color:#1a8a52">${fmtMM(totalGestionado)}</div><div class="kpi-lbl">Confirmado</div></div></div>`;

  const byWeek=weeks.map(w=>({Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0}));
  rows.forEach(h=>{if(!h.semanaDate)return;weeks.forEach((w,i)=>{if(h.semanaDate>=w.start&&h.semanaDate<=w.end)byWeek[i][h.tipo]+=h.valor;});});
  const labels=weeks.map(w=>[`${fcShort(w.start)}–${fcShort(w.end)}`,`Semana ${semanaNumOf(w.start)}`]);
  if(fcSemanaChart)fcSemanaChart.destroy();
  fcSemanaChart=new Chart(document.getElementById('fcSemanaChart'),{type:'bar',
    data:{labels,datasets:['Anticipo','Corte','Liquidación','Retegarantía'].map(t=>({label:t,backgroundColor:TIPO_COLOR_FC[t],data:byWeek.map(w=>w[t]),stack:'s',borderRadius:3}))},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmtMM(c.raw)}`}}},
      scales:{x:{stacked:true,grid:{display:false},ticks:{color:"#6b6b66",font:{size:9}},border:{display:false}},
               y:{stacked:true,grid:{color:"#f0efec"},ticks:{color:"#6b6b66",font:{size:10},callback:v=>fmtMM(v)},border:{display:false}}}}});

  const tipoTotals={Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0};
  rows.forEach(h=>tipoTotals[h.tipo]+=h.valor);
  const tLabels=Object.keys(tipoTotals),tData=Object.values(tipoTotals),tColors=tLabels.map(l=>TIPO_COLOR_FC[l]);
  if(fcTipoChart)fcTipoChart.destroy();
  fcTipoChart=new Chart(document.getElementById('fcTipoChart'),{type:'doughnut',
    data:{labels:tLabels,datasets:[{data:tData,backgroundColor:tColors,borderWidth:6,borderColor:'#fff',borderRadius:8,spacing:4}]},
    options:{responsive:false,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.label}: ${fmtMM(c.raw)}`}}}}});
  document.getElementById('fc-donut-n').textContent=rows.length;
  document.getElementById('fc-tipo-legend').innerHTML=tLabels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${tColors[i]}"></div><span>${l}</span><span class="legend-n">${fmtMM(tData[i])}</span></div>`).join('');

  const vencidosSet=new Set(vencidos);
  const pendRows=rows.filter(h=>h.estado!=='Confirmado'&&!vencidosSet.has(h)).sort((a,b)=>{const av=a.semanaDate?a.semanaDate.getTime():Infinity;const bv=b.semanaDate?b.semanaDate.getTime():Infinity;return av-bv;});
  document.getElementById('fc-hitos-tbody').innerHTML=pendRows.length?pendRows.map(h=>{
    const hbCls=h.estado==='Confirmado'?'hb-cob':'hb-pend';
    return`<tr>
      <td>${h.semanaDate?fcShort(h.semanaDate):'<em style="color:#bbb">Sin fecha</em>'}</td>
      <td class="td-primary">${h.proyecto}</td><td>${h.encargado||''}</td>
      <td><span class="ht ht-${h.tipo}">${h.label||h.tipo}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(h.valor)}</td>
      <td><span class="hb ${hbCls}">${h.estado}</span></td>
      <td style="text-align:center">${presentadoIcon(h,today0)}</td></tr>`;}).join(''):
    '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px">No hay hitos pendientes con los filtros actuales (los vencidos se muestran en el cuadro de arriba)</td></tr>';

  document.getElementById('fc-proy-tbody').innerHTML=FLUJO_CAJA.filter(fc=>codigosVisibles.has(fc.codigo)).map(fc=>{
    const p=PROJECTS.find(x=>x.codigo===fc.codigo);if(!p)return'';
    const programado=fc.hitos.filter(h=>h.tipo!=='Retegarantía').reduce((s,h)=>s+h.valor,0);
    const sinProgramar=Math.max(0,(p.valor||0)-programado);
    const cls=EB[p.estado]||"eb-cerr";
    return`<tr><td class="td-code">${p.codigo}</td><td class="td-primary">${p.proyecto}</td><td>${p.encargado}</td>
      <td><span class="estado-badge ${cls}">${p.estado}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(p.valor)}</td>
      <td class="td-money" style="text-align:right">${fmtMM(programado)}</td>
      <td style="text-align:right;color:${sinProgramar>0?'#a0620a':'#aaa'}">${sinProgramar>0?fmtMM(sinProgramar):'—'}</td></tr>`;
  }).join('');
}

async function refreshFlujoCaja(){
  const btn=document.getElementById('fc-refresh-btn');
  const timeEl=document.getElementById('fc-refresh-time');
  const fcNote=document.getElementById('fc-note');
  if(btn){btn.disabled=true;btn.textContent='⟳ Actualizando...';}
  if(fcNote){fcNote.style.display='block';fcNote.textContent='⏳ Cargando datos en vivo desde el Google Sheet...';}
  await loadFlujoCajaLive();
  buildFlujoCaja();
  if(btn){btn.disabled=false;btn.textContent='⟳ Actualizar datos';}
  if(timeEl){
    const now=new Date();
    const fecha=now.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'});
    const hora=now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
    timeEl.textContent='Última actualización: '+fecha+' · '+hora;
  }
}


/* ═══ FUSIÓN: Resumen Ejecutivo / Directores / Alertas / Comparativo / KPI's ═══ */
const EC={"Finalizado":"#e8622a","En Ejecución":"#f7c400","En Liquidación":"#a82c00","Garantias":"#7a1010","Por Iniciar":"#ffaa44","Cerrado":"#9e8c80"};
const EB={"Finalizado":"eb-fin","En Ejecución":"eb-ejec","En Liquidación":"eb-liq","Garantias":"eb-gar","Por Iniciar":"eb-ini","Cerrado":"eb-cerr"};
const fmtPct=v=>v?v.toFixed(1)+"%":"—";
const hCol=v=>v>=85?"#1a8a52":v>=60?"#c08a00":"#c0392b";
let donutChart,sectorChart,compMesChart,compDirCountChart;

/* Recalcula filteredProjects según el rol de la sesión activa.
   Gerente/Admin: todos los proyectos. Director: solo los suyos (por 'encargado').
   Residente/otros: por ahora ninguno — el PROJECTS estático de este dashboard no
   tiene un campo de "residente" separado (solo 'encargado', que históricamente
   apunta al Director/responsable), así que no hay forma de filtrar por Residente
   todavía. Si se necesita, hay que agregar esa columna al PROJECTS. */
let dropdownFilteredAll = PROJECTS; // PROJECTS filtrado solo por los desplegables (Año/Mes/Encargado/Estado/Sector), sin restricción de rol — esto alimenta KPI's
const MESES_NOM=['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function populateFilters(){
  const fa=document.getElementById('fil-anio');
  [...new Set(PROJECTS.map(p=>p.anio).filter(a=>a))].sort().forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;fa.appendChild(o);});
  const fm=document.getElementById('fil-mes');
  [...new Set(PROJECTS.map(p=>p.mes).filter(m=>m))].sort((a,b)=>a-b).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=MESES_NOM[m];fm.appendChild(o);});
  const fe=document.getElementById('fil-enc');
  [...new Set(PROJECTS.map(p=>p.encargado))].sort().forEach(e=>{const o=document.createElement('option');o.textContent=e;fe.appendChild(o);});
  const fs=document.getElementById('fil-sector');
  [...new Set(PROJECTS.map(p=>p.sector).filter(s=>s))].sort().forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;fs.appendChild(o);});
}

function applyFilters(){
  const an=document.getElementById('fil-anio').value;
  const mn=document.getElementById('fil-mes').value;
  const en=document.getElementById('fil-enc').value;
  const es=document.getElementById('fil-estado').value;
  const sc=document.getElementById('fil-sector').value;
  dropdownFilteredAll = PROJECTS.filter(p=>{
    if(an!=='todos'&&p.anio!=an)return false;
    if(mn!=='todos'&&p.mes!=mn)return false;
    if(en!=='todos'&&p.encargado!==en)return false;
    if(es!=='todos'&&p.estado!==es)return false;
    if(sc!=='todos'&&p.sector!==sc)return false;
    return true;
  });
  computeFilteredProjects();
  rebuildCurrentFinancialView();
}

function rebuildCurrentFinancialView(){
  // Vuelve a dibujar solo la vista financiera que esté activa en este momento
  if(currentView === 'kpis'){ buildKPIs(); buildFinanceBar(); buildDonut(); buildHealth(); buildSector(); }
  else if(currentView === 'resumen'){ buildRisks(); buildActions(); }
  else if(currentView === 'alertas'){ buildAlertas(); }
  else if(currentView === 'directores'){ buildDirectores(); closeDrawer(); }
  else if(currentView === 'comparativo'){ buildComparativo(); }
  else if(currentView === 'todos-proyectos'){ buildEstadoFiltersTodos(); buildTodosProyectosTabla(null); }
}

function computeFilteredProjects(){
  const s = getSession();
  const base = dropdownFilteredAll;
  if(s.rol === 'Gerente' || s.rol === 'Admin'){ filteredProjects = base; }
  else if(s.rol === 'Director'){ filteredProjects = base.filter(p => p.encargado === s.nombre); }
  else { filteredProjects = []; }
}

function buildKPIs(){
  const fp=dropdownFilteredAll; // KPI's: visible a todos, filtrable por los desplegables, sin restricción de rol
  const kpis=[
    {n:fp.length,l:"Total proyectos",ic:"total",c:"#e8622a"},
    {n:fp.filter(p=>p.estado==="Finalizado").length,l:"Finalizados",ic:"fin",c:"#5a8a5a"},
    {n:fp.filter(p=>p.estado==="En Ejecución").length,l:"En ejecución",ic:"ejec",c:"#1a8a52"},
    {n:fp.filter(p=>p.estado==="En Liquidación").length,l:"En liquidación",ic:"liq",c:"#c08a00"},
    {n:fp.filter(p=>p.estado==="Por Iniciar").length,l:"Por iniciar",ic:"ini",c:"#4a3aa7"},
    {n:fp.filter(p=>p.estado==="Cerrado").length,l:"Cerrados",ic:"cerr",c:"#6b6b66"},
    {n:fp.filter(p=>p.estado==="Garantias").length,l:"Garantías",ic:"gar",c:"#1a5fa5"},
  ];
  const svgs=['<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>','<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>','<polygon points="5 3 19 12 5 21 5 3"/>','<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','<path d="M5 12l5-5 5 5 5-5"/>','<polyline points="20 6 9 17 4 12"/>','<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'];
  const el=document.getElementById('kpi-strip');
  if(el)el.innerHTML=kpis.map((k,i)=>`
    <div class="kpi"><div class="kpi-ico ${k.ic}"><svg width="16" height="16" fill="none" stroke="${k.c}" stroke-width="1.8" viewBox="0 0 24 24">${svgs[i]}</svg></div>
    <div><div class="kpi-num">${k.n}</div><div class="kpi-lbl">${k.l}</div></div></div>`).join('');
}

function buildFinanceBar(){
  const fp=dropdownFilteredAll; // igual que KPIs: visible a todos, filtrable por los desplegables
  const tv=fp.reduce((a,p)=>a+(p.valor||0),0);
  const tf=fp.reduce((a,p)=>a+(p.pxFacturar||0),0);
  const tc=fp.reduce((a,p)=>a+(p.pxCobrar||0),0);
  const as=fp.filter(p=>p.difSNpct>0).length?fp.reduce((a,p)=>a+(p.difSNpct||0),0)/fp.filter(p=>p.difSNpct>0).length:0;
  const ac=fp.filter(p=>p.difCNpct>0&&p.difCNpct<200).length?fp.reduce((a,p)=>a+(p.difCNpct<200?p.difCNpct||0:0),0)/fp.filter(p=>p.difCNpct>0&&p.difCNpct<200).length:0;
  const el=document.getElementById('finance-bar');
  if(el)el.innerHTML=`
    <div class="finance-bar-lbl">Desempeño<br>financiero</div>
    <div class="finance-item"><div class="fn">${fmtMM(tv)}</div><div class="fl">Valor total (COP)</div></div>
    <div class="finance-item"><div class="fn">${fmtMM(tf)}</div><div class="fl">Pendiente facturar</div><div class="fd neg">▼ Gestión requerida</div></div>
    <div class="finance-item"><div class="fn">${fmtMM(tc)}</div><div class="fl">Pendiente cobrar</div><div class="fd neg">▼ Cartera activa</div></div>
    <div class="finance-item"><div class="fn">${as.toFixed(1)}%</div><div class="fl">Diferencia SN prom.</div></div>
    <div class="finance-item"><div class="fn">${ac.toFixed(1)}%</div><div class="fl">Diferencia CN prom.</div></div>`;
}

function buildDonut(){
  const fp=dropdownFilteredAll;
  const counts={};fp.forEach(p=>{counts[p.estado]=(counts[p.estado]||0)+1;});
  const labels=Object.keys(counts),data=labels.map(l=>counts[l]),colors=labels.map(l=>EC[l]||"#888");
  const canvas=document.getElementById('donutChart');
  if(!canvas)return;
  if(donutChart)donutChart.destroy();
  donutChart=new Chart(canvas,{
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:6,borderColor:'#faf9f7',borderRadius:8,spacing:4,hoverOffset:8}]},
    options:{responsive:false,maintainAspectRatio:false,cutout:'58%',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw/fp.length*100)}%)`}}},
      animation:{animateRotate:true,duration:700}
    }
  });
  document.getElementById('donut-center-text').innerHTML=`<div class="donut-big-n">${fp.length}</div><div class="donut-sub">proyectos</div>`;
  document.getElementById('donut-legend').innerHTML=labels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span><span class="legend-n">${data[i]}</span></div>`).join('');
}

function buildHealth(){
  const items=[{lbl:"Cronograma",pct:70},{lbl:"Financiero",pct:72},{lbl:"Facturación",pct:65},{lbl:"Cartera",pct:55},{lbl:"Documentación",pct:60}];
  const el=document.getElementById('health-list');
  if(el)el.innerHTML=items.map(h=>`<div class="health-row"><div class="health-lbl">${h.lbl}</div><div class="hbar-bg"><div class="hbar-fill" style="width:${h.pct}%;background:${hCol(h.pct)}"></div></div><div class="health-pct" style="color:${hCol(h.pct)}">${h.pct}%</div><div class="hdot" style="background:${hCol(h.pct)}"></div></div>`).join('');
}

function buildSector(){
  const sec={};dropdownFilteredAll.forEach(p=>{if(p.sector)sec[p.sector]=(sec[p.sector]||0)+1;});
  const sorted=Object.entries(sec).sort((a,b)=>b[1]-a[1]);
  const colors=["#e8622a","#f5a623","#d94f00","#f7c948","#c0392b","#8c7b6e","#e8905a"];
  const canvas=document.getElementById('sectorChart');
  if(!canvas)return;
  if(sectorChart)sectorChart.destroy();
  sectorChart=new Chart(canvas,{type:'bar',data:{labels:sorted.map(s=>s[0]),datasets:[{data:sorted.map(s=>s[1]),backgroundColor:colors,borderRadius:4,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#6b6b66",font:{size:10}},border:{display:false}},y:{grid:{display:false},ticks:{color:"#6b6b66",font:{size:10}},border:{display:false}}}}});
}

/* NOTA: estos dos usan una lista de ejemplo fija (no calculada desde PROJECTS
   todavía) — igual que en el dashboard original. Si quieres que reflejen datos
   reales y respeten el filtro de proyectos del Director, hay que reescribirlos
   para derivarse de PROJECTS/filteredProjects en vez de un arreglo fijo. */
function buildRisks(){
  const risks=[{proj:"IAE — C-26-009",desc:"Retraso 48 días. Cronograma crítico.",nivel:"alta"},{proj:"Intercontinental",desc:"Cartera pendiente masiva. Anomalía contable.",nivel:"alta"},{proj:"Av Chile — C-26-007",desc:"Diferencia SN 44.3% — revisar margen real.",nivel:"media"},{proj:"Reparaciones P11",desc:"Sin documentación contractual básica.",nivel:"media"},{proj:"SOCA — C-26-017",desc:"Sin actas, cronograma, informes ni preliq.",nivel:"media"}];
  const el=document.getElementById('risk-list');
  if(el)el.innerHTML=risks.map(r=>`<div class="risk-row"><span class="rbadge ${r.nivel}">${r.nivel.toUpperCase()}</span><div><div class="risk-proj">${r.proj}</div><div class="risk-desc">${r.desc}</div></div></div>`).join('');
}

function buildActions(){
  const actions=[{proj:"IAE",desc:"Implementar plan de choque en actividades críticas",resp:"Jeison Cera",prio:"alta"},{proj:"Intercontinental",desc:"Gestionar recaudo y verificar valor contable",resp:"Luis Mantilla",prio:"alta"},{proj:"Reparaciones P11",desc:"Completar documentación básica faltante",resp:"Jeison Cera",prio:"media"},{proj:"SOCA",desc:"Cargar actas, informes y preliquidación",resp:"Andres R.",prio:"media"},{proj:"Av Chile",desc:"Cerrar acta de entrega pendiente",resp:"Alejandro P.",prio:"baja"}];
  const el=document.getElementById('action-list');
  if(el)el.innerHTML=actions.map(a=>`<div class="action-row"><div class="aproj">${a.proj}</div><div class="adesc">${a.desc}</div><div class="aresp">${a.resp}</div><span class="pbadge ${a.prio}">${a.prio.toUpperCase()}</span></div>`).join('');
}

function buildDirectores(){
  const dirs={};
  filteredProjects.forEach(p=>{if(!dirs[p.encargado])dirs[p.encargado]={name:p.encargado,cargo:p.cargo,proyectos:[],totalValor:0,totalCobrar:0};dirs[p.encargado].proyectos.push(p);dirs[p.encargado].totalValor+=p.valor||0;dirs[p.encargado].totalCobrar+=p.pxCobrar||0;});
  document.getElementById('dir-grid').innerHTML=Object.values(dirs).map(d=>{
    const ejec=d.proyectos.filter(p=>p.estado==="En Ejecución").length;
    const liq=d.proyectos.filter(p=>p.estado==="En Liquidación").length;
    const avProm=d.proyectos.length?Math.round(d.proyectos.reduce((a,p)=>a+(p.avObra||0),0)/d.proyectos.length):0;
    const initials=d.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const avC=hCol(avProm);
    const ccvArr=d.proyectos.filter(p=>p.difCNpct!=null&&p.difCNpct!==0);
    const scvArr=d.proyectos.filter(p=>p.difSNpct!=null&&p.difSNpct!==0);
    const avgCCV=ccvArr.length?ccvArr.reduce((s,p)=>s+(p.difCNpct||0),0)/ccvArr.length:null;
    const avgSCV=scvArr.length?scvArr.reduce((s,p)=>s+(p.difSNpct||0),0)/scvArr.length:null;
    const fmtDif=(v,n)=>v==null?`<span style="color:#aaa">—</span>`:`<span style="color:${v>=0?'#1a8a52':'#c0392b'}">${v>=0?'+':''}${v.toFixed(1)}%</span><span style="font-size:9px;color:#aaa;margin-left:3px">(${n} proy.)</span>`;
    return`<div class="dir-card" data-dir="${d.name}" onclick="openDrawer('${d.name}')">
      <div class="dir-head"><div class="dir-av">${initials}</div><div><div class="dir-name">${d.name}</div><div class="dir-cargo">${d.cargo}</div></div></div>
      <div class="dir-kpis">
        <div class="dir-kpi"><div class="dir-kpi-n">${d.proyectos.length}</div><div class="dir-kpi-l">Proyectos</div></div>
        <div class="dir-kpi"><div class="dir-kpi-n">${ejec}</div><div class="dir-kpi-l">En ejec.</div></div>
        <div class="dir-kpi"><div class="dir-kpi-n">${liq}</div><div class="dir-kpi-l">En liq.</div></div>
      </div>
      <div class="dir-fin">
        <div class="dir-fin-item"><div class="dir-fin-v">${fmtMM(d.totalValor)}</div><div class="dir-fin-l">Valor portafolio</div></div>
        <div class="dir-fin-item"><div class="dir-fin-v" style="color:#c0392b">${fmtMM(d.totalCobrar)}</div><div class="dir-fin-l">Pend. cobrar</div></div>
      </div>
      <div class="dir-dif-row">
        <div class="dir-dif-item"><div class="dir-dif-l">Dif. CCV% prom.</div><div class="dir-dif-v">${fmtDif(avgCCV,ccvArr.length)}</div></div>
        <div class="dir-dif-item"><div class="dir-dif-l">Dif. SCV% prom.</div><div class="dir-dif-v">${fmtDif(avgSCV,scvArr.length)}</div></div>
      </div>
      <div class="dir-av-row"><div class="dir-av-lbl">Avance prom.</div><div class="dir-av-bg"><div class="dir-av-fill" style="width:${avProm}%;background:${avC}"></div></div><div class="dir-pct" style="color:${avC}">${avProm}%</div></div>
    </div>`;}).join('');
}

function openDrawer(dirName){
  document.querySelectorAll('.dir-card').forEach(c=>c.classList.remove('selected'));
  const card=[...document.querySelectorAll('.dir-card')].find(c=>c.dataset.dir===dirName);
  if(card)card.classList.add('selected');
  const projs=filteredProjects.filter(p=>p.encargado===dirName);
  const EC_local={"Finalizado":"#5a8a5a","En Ejecución":"#1a8a52","En Liquidación":"#c08a00","Garantias":"#1a5fa5","Por Iniciar":"#4a3aa7","Cerrado":"#6b6b66"};
  const rows=projs.map(p=>{
    const ccvC=p.difCNpct>0?'#1a8a52':p.difCNpct<0?'#c0392b':'#aaa';
    const scvC=p.difSNpct>0?'#1a8a52':p.difSNpct<0?'#c0392b':'#aaa';
    const est=`<span style="background:${EC_local[p.estado]||'#888'};color:#fff;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600">${p.estado}</span>`;
    const dCCV=p.difCNpct!=null&&p.difCNpct!==0?`<span style="color:${ccvC}">${p.difCNpct>0?'+':''}${p.difCNpct.toFixed(1)}%</span>`:'<span style="color:#aaa">—</span>';
    const dSCV=p.difSNpct!=null&&p.difSNpct!==0?`<span style="color:${scvC}">${p.difSNpct>0?'+':''}${p.difSNpct.toFixed(1)}%</span>`:'<span style="color:#aaa">—</span>';
    const fac=p.pxFacturar>0?`<span style="color:#c08a00">${fmtMM(p.pxFacturar)}</span>`:'<span style="color:#aaa">—</span>';
    const cob=p.pxCobrar>0?`<span style="color:#c0392b">${fmtMM(p.pxCobrar)}</span>`:'<span style="color:#aaa">—</span>';
    return `<tr>
      <td style="font-weight:600;color:#666">${p.codigo}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis" title="${p.proyecto}">${p.proyecto}</td>
      <td>${est}</td>
      <td style="text-align:right">${fmtMM(p.valor)}</td>
      <td style="text-align:right">${dCCV}</td>
      <td style="text-align:right">${dSCV}</td>
      <td style="text-align:right">${fac}</td>
      <td style="text-align:right">${cob}</td>
      <td style="text-align:right">${p.avObra!=null?p.avObra+'%':'—'}</td>
    </tr>`;
  }).join('');
  const totVal=projs.reduce((s,p)=>s+(p.valor||0),0);
  const totFac=projs.reduce((s,p)=>s+(p.pxFacturar||0),0);
  const totCob=projs.reduce((s,p)=>s+(p.pxCobrar||0),0);
  document.getElementById('dir-drawer-ttl').textContent=dirName;
  document.getElementById('dir-drawer-body').innerHTML=rows;
  const ccvArr2=projs.filter(p=>p.difCNpct!=null&&p.difCNpct!==0);
  const scvArr2=projs.filter(p=>p.difSNpct!=null&&p.difSNpct!==0);
  const avgCCV2=ccvArr2.length?ccvArr2.reduce((s,p)=>s+p.difCNpct,0)/ccvArr2.length:null;
  const avgSCV2=scvArr2.length?scvArr2.reduce((s,p)=>s+p.difSNpct,0)/scvArr2.length:null;
  const fmtAvg=(v,el)=>{if(v==null){el.textContent='—';el.style.color='#aaa';return;}
    el.textContent=(v>0?'+':'')+v.toFixed(1)+'%';el.style.color=v>=0?'#1a8a52':'#c0392b';};
  document.getElementById('tot-n').textContent=projs.length+' proyectos';
  document.getElementById('tot-val').textContent=fmtMM(totVal);
  document.getElementById('tot-fac').textContent=totFac>0?fmtMM(totFac):'—';
  document.getElementById('tot-cob').textContent=totCob>0?fmtMM(totCob):'—';
  fmtAvg(avgCCV2,document.getElementById('tot-ccv'));
  fmtAvg(avgSCV2,document.getElementById('tot-scv'));
  document.getElementById('dir-drawer').classList.add('open');
}
function closeDrawer(){
  document.getElementById('dir-drawer').classList.remove('open');
  document.querySelectorAll('.dir-card').forEach(c=>c.classList.remove('selected'));
}

/* Alertas: visible a TODOS los roles, pero filtrado por los proyectos que
   cada quien puede ver (filteredProjects). Nota: para Residente, hoy esto
   sale vacío por la misma limitación de datos explicada en computeFilteredProjects. */
function buildAlertas(){
  const base=filteredProjects;
  const note=document.getElementById('alertas-scope-note');
  if(note){
    if(base.length===0){
      note.style.display='block';
      note.textContent='⚠ No se encontraron proyectos asociados a tu usuario en la base de datos financiera todavía. Habla con tu Gerente para que se agregue tu nombre como responsable en el proyecto correspondiente.';
    } else note.style.display='none';
  }
  const withObs=base.filter(p=>p.obs&&p.obs.length>5);
  document.getElementById('obs-list').innerHTML=withObs.length?withObs.map(p=>`<div class="obs-row"><span class="obs-code">${p.codigo}</span><span class="obs-txt"><strong style="color:#1a1a1a">${p.proyecto}</strong> — ${p.obs}</span></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin observaciones críticas.</div>';
  const delayed=base.filter(p=>p.dias>10).sort((a,b)=>b.dias-a.dias);
  document.getElementById('delay-list').innerHTML=delayed.length?delayed.map(p=>`<div class="risk-row"><span class="rbadge ${p.dias>50?'alta':'media'}">${p.dias}d</span><div><div class="risk-proj">${p.proyecto}</div><div class="risk-desc">${p.encargado} — ${p.estado}</div></div></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin retrasos significativos.</div>';
  const highSN=base.filter(p=>p.difSNpct>30&&p.difSNpct<200).sort((a,b)=>b.difSNpct-a.difSNpct);
  document.getElementById('margin-list').innerHTML=highSN.length?highSN.map(p=>`<div class="risk-row"><span class="rbadge alta">${fmtPct(p.difSNpct)}</span><div><div class="risk-proj">${p.proyecto}</div><div class="risk-desc">${p.encargado} — ${p.estado}</div></div></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin diferencias críticas.</div>';
}

function buildComparativo(){
  const p25=filteredProjects.filter(p=>p.anio===2025);
  const p26=filteredProjects.filter(p=>p.anio===2026);
  function yrCard(pp){
    const val=pp.reduce((s,p)=>s+p.valor,0);
    const abonos=pp.reduce((s,p)=>s+p.vPagado,0);
    const fin=pp.filter(p=>p.estado==='Finalizado'||p.estado==='Cerrado').length;
    const ejec=pp.filter(p=>p.estado==='En Ejecución').length;
    const mgnArr=pp.filter(p=>p.difSNpct>0);
    const mgn=mgnArr.length?mgnArr.reduce((s,p)=>s+p.difSNpct,0)/mgnArr.length:0;
    return [
      {n:pp.length,     l:'Proyectos'},
      {n:fmtMM(val),    l:'Valor CCV'},
      {n:fmtMM(abonos), l:'Abonos'},
      {n:fin,           l:'Finalizados'},
      {n:ejec,          l:'En Ejecución'},
      {n:mgn.toFixed(1)+'%', l:'Margen SCV'}
    ].map(k=>`<div class="cmp-kpi"><div class="cmp-kpi-n">${k.n}</div><div class="cmp-kpi-l">${k.l}</div></div>`).join('');
  }
  document.getElementById('cmp-kpi-25').innerHTML=yrCard(p25);
  document.getElementById('cmp-kpi-26').innerHTML=yrCard(p26);
  const chOpts=(fmt)=>({
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:11}}},
      tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
    scales:{y:{ticks:{callback:v=>fmt(v)},grid:{color:'rgba(0,0,0,.04)'}},
            x:{grid:{display:false},ticks:{font:{size:10},maxRotation:45}}}
  });
  const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const mv25=meses.map((_,i)=>Math.round(p25.filter(p=>(p.estado==='Finalizado'||p.estado==='Cerrado')&&p.mes===i+1).reduce((s,p)=>s+p.valor,0)/1e6));
  const mv26=meses.map((_,i)=>Math.round(p26.filter(p=>(p.estado==='Finalizado'||p.estado==='Cerrado')&&p.mes===i+1).reduce((s,p)=>s+p.valor,0)/1e6));
  if(compMesChart)compMesChart.destroy();
  compMesChart=new Chart(document.getElementById('compMesChart'),{type:'bar',
    data:{labels:meses,datasets:[
      {label:'2025',data:mv25,backgroundColor:'#f5a623',borderRadius:4,barPercentage:.65},
      {label:'2026',data:mv26,backgroundColor:'#e8622a',borderRadius:4,barPercentage:.65}
    ]},options:chOpts(v=>'$'+v+' M')});
  const dirs=[...new Set(filteredProjects.map(p=>p.encargado))].sort();
  const c25=dirs.map(d=>p25.filter(p=>p.encargado===d).length);
  const c26=dirs.map(d=>p26.filter(p=>p.encargado===d).length);
  if(compDirCountChart)compDirCountChart.destroy();
  compDirCountChart=new Chart(document.getElementById('compDirCountChart'),{type:'bar',
    data:{labels:dirs,datasets:[
      {label:'2025',data:c25,backgroundColor:'#f5a623',borderRadius:4,barPercentage:.7},
      {label:'2026',data:c26,backgroundColor:'#e8622a',borderRadius:4,barPercentage:.7}
    ]},options:chOpts(v=>v+' proy.')});
  const sects=[...new Set(filteredProjects.map(p=>p.sector).filter(Boolean))].sort();
  const rows=sects.map(s=>{
    const s25=p25.filter(p=>p.sector===s);
    const s26=p26.filter(p=>p.sector===s);
    return `<tr><td>${s}</td><td>${s25.length} proy. &nbsp;${fmtMM(s25.reduce((a,p)=>a+p.valor,0))}</td><td>${s26.length} proy. &nbsp;${fmtMM(s26.reduce((a,p)=>a+p.valor,0))}</td></tr>`;
  }).join('');
  document.getElementById('comp-sector-table').innerHTML=`
    <table class="comp-table">
      <thead><tr><th>Sector</th><th>2025</th><th>2026</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}


const FASE_ORDER = ['Inicio','Planeación','Ejecución','Cierre','Seguimiento y control'];
let currentProject = null;
let currentFaseIndex = 0;
let currentView = 'projects'; // 'projects' | 'timeline'

function handleSessionError_(note, message){
  note.className = 'load-note error';
  note.textContent = '⚠ ' + message;
  if(/sesi[oó]n/i.test(message)){
    note.textContent += ' Redirigiendo al login...';
    setTimeout(doLogout, 1800);
  }
}

function saveSession(token, nombre, rol){
  sessionStorage.setItem('mn_token', token);
  sessionStorage.setItem('mn_nombre', nombre);
  sessionStorage.setItem('mn_rol', rol);
}
function getSession(){
  return {
    token: sessionStorage.getItem('mn_token'),
    nombre: sessionStorage.getItem('mn_nombre'),
    rol: sessionStorage.getItem('mn_rol')
  };
}
function clearSession(){
  sessionStorage.removeItem('mn_token');
  sessionStorage.removeItem('mn_nombre');
  sessionStorage.removeItem('mn_rol');
}

async function doLogin(){
  const correo = document.getElementById('login-correo').value.trim();
  const pass = document.getElementById('login-pass').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  if(!correo || !pass){ errEl.textContent = 'Ingresa tu correo y contraseña.'; return; }
  if(API_URL.indexOf('PEGA_AQUI') !== -1){
    errEl.textContent = 'Falta configurar API_URL en este archivo.';
    return;
  }
  btn.disabled = true; btn.textContent = 'Verificando...';
  try{
    // POST con body como texto plano (evita el preflight CORS que Apps Script no maneja)
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', correo, contrasena: pass })
    });
    const data = await res.json();
    if(data.ok){
      saveSession(data.token, data.nombre, data.rol);
      enterApp();
    } else {
      errEl.textContent = data.error || 'Correo o contraseña incorrectos.';
    }
  }catch(e){
    errEl.textContent = 'No se pudo conectar con el servidor.';
  }
  btn.disabled = false; btn.textContent = 'Entrar';
}

function doLogout(){
  clearSession();
  document.getElementById('login-correo').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

const ALL_VIEW_IDS = ['view-projects','view-timeline','view-new-project','view-flujocaja','view-kpis','view-resumen','view-alertas','view-directores','view-comparativo','view-todos-proyectos'];
function hideAllViews(){
  ALL_VIEW_IDS.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
}

function enterApp(){
  const s = getSession();
  document.getElementById('user-info').innerHTML = '<strong>' + s.nombre + '</strong><br>' + (s.rol || '');
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  populateFilters();
  computeFilteredProjects();
  const esGerencia = s.rol === 'Gerente' || s.rol === 'Admin';
  const puedeVerFinanciero = s.rol === 'Director' || esGerencia;
  document.getElementById('nav-flujo-caja').style.display = puedeVerFinanciero ? 'flex' : 'none';
  document.getElementById('nav-resumen').style.display = puedeVerFinanciero ? 'flex' : 'none';
  document.getElementById('nav-todos-proyectos').style.display = puedeVerFinanciero ? 'flex' : 'none';
  document.getElementById('nav-directores').style.display = esGerencia ? 'flex' : 'none';
  document.getElementById('nav-comparativo').style.display = esGerencia ? 'flex' : 'none';
  document.getElementById('nav-nuevo-proyecto').style.display = esGerencia ? 'flex' : 'none';
  goToProjectList();
}

function refreshCurrentView(){
  if(currentView === 'projects') loadProjects();
  else if(currentView === 'timeline') loadProjectChecklist(currentProject.codigo);
}

function setActiveNav(id){
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

function showFilters(show){
  document.getElementById('topbar-filters').style.display = show ? 'flex' : 'none';
}

function goToProjectList(){
  currentView = 'projects';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-projects').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'MIS PROYECTOS';
  document.getElementById('topbar-sub').textContent = 'Proyectos asignados a tu usuario';
  document.getElementById('refresh-btn').style.display = 'inline-block';
  setActiveNav('nav-mis-proyectos');
  loadProjects();
}

function goToFlujoCaja(){
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return; // respaldo; el nav ya está oculto
  currentView = 'flujocaja';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-flujocaja').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'FLUJO DE CAJA';
  document.getElementById('topbar-sub').textContent = 'Control de hitos de cobro — próximas 12 semanas';
  document.getElementById('refresh-btn').style.display = 'none'; // esta vista tiene su propio botón "Actualizar"
  setActiveNav('nav-flujo-caja');
  refreshFlujoCaja();
}

function goToTodosProyectos(){
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'todos-proyectos';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-todos-proyectos').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'TODOS LOS PROYECTOS';
  document.getElementById('topbar-sub').textContent = s.rol === 'Director' ? 'Todo tu portafolio, activo e histórico' : 'Portafolio completo de Mínima Arquitectos';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-todos-proyectos');
  buildEstadoFiltersTodos();
  buildTodosProyectosTabla(null);
}

function buildEstadoFiltersTodos(){
  const estados = ['Todos','Finalizado','En Ejecución','En Liquidación','Garantias','Por Iniciar','Cerrado'];
  const el = document.getElementById('estado-filters-todos');
  el.innerHTML = '';
  estados.forEach((e,i) => {
    const btn = document.createElement('button');
    btn.className = 'pfbtn' + (i===0 ? ' active' : '');
    btn.textContent = e + (e!=='Todos' ? ' (' + filteredProjects.filter(p=>p.estado===e).length + ')' : '');
    btn.onclick = function(){
      document.querySelectorAll('#estado-filters-todos .pfbtn').forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      buildTodosProyectosTabla(e==='Todos' ? null : e);
    };
    el.appendChild(btn);
  });
}

function buildTodosProyectosTabla(estadoFiltro){
  const fp = estadoFiltro ? filteredProjects.filter(p=>p.estado===estadoFiltro) : filteredProjects;
  document.getElementById('todos-proyectos-tbody').innerHTML = fp.map(p => {
    const cls = EB[p.estado] || 'eb-cerr';
    const avC = p.avObra>=75 ? '#1a8a52' : p.avObra>=40 ? '#c08a00' : '#c0392b';
    const snC = p.difSNpct>35 ? 'td-neg' : p.difSNpct>25 ? 'td-warn' : 'td-ok';
    return `<tr>
      <td class="td-code">${p.codigo}</td>
      <td class="td-primary" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.proyecto}</td>
      <td>${p.cliente}</td><td><span class="estado-badge ${cls}">${p.estado}</span></td>
      <td>${p.encargado}</td><td>${p.ciudad||'—'}</td>
      <td class="td-money" style="text-align:right">${fmtMM(p.valor)}</td>
      <td class="td-money" style="text-align:right;color:${p.pxCobrar>500000000?'#c0392b':'inherit'}">${fmtMM(p.pxCobrar)}</td>
      <td class="${snC}" style="text-align:right">${fmtPct(p.difSNpct)}</td>
      <td><div style="display:flex;align-items:center;gap:5px"><div class="av-bar"><div class="av-fill" style="width:${p.avObra}%;background:${avC}"></div></div><span style="font-size:10px;color:#6b6b66">${p.avObra}%</span></div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px">Sin proyectos con este filtro.</td></tr>';
}

function goToKPIs(){
  currentView = 'kpis';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-kpis').style.display = 'block';
  document.getElementById('topbar-title').textContent = "KPI'S";
  document.getElementById('topbar-sub').textContent = 'Indicadores generales de todo el portafolio';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-kpis');
  buildKPIs(); buildFinanceBar(); buildDonut(); buildHealth(); buildSector();
}

function goToResumen(){
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'resumen';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-resumen').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'RESUMEN EJECUTIVO';
  document.getElementById('topbar-sub').textContent = s.rol === 'Director' ? 'Tus proyectos asignados' : 'Portafolio completo';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-resumen');
  buildRisks(); buildActions();
}

function goToAlertas(){
  currentView = 'alertas';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-alertas').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'ALERTAS';
  document.getElementById('topbar-sub').textContent = 'Observaciones y riesgos de tus proyectos asignados';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-alertas');
  buildAlertas();
}

function goToDirectores(){
  const s = getSession();
  if(!(s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'directores';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-directores').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'DIRECTORES';
  document.getElementById('topbar-sub').textContent = 'Desempeño por director';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-directores');
  buildDirectores();
}

function goToComparativo(){
  const s = getSession();
  if(!(s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'comparativo';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-comparativo').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'COMPARATIVO ANUAL';
  document.getElementById('topbar-sub').textContent = '2025 vs 2026';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-comparativo');
  buildComparativo();
}

function goToNewProject(){
  const s = getSession();
  if(!(s.rol === 'Gerente' || s.rol === 'Admin')) return; // respaldo; el nav ya está oculto
  currentView = 'new-project';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-new-project').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'NUEVO PROYECTO';
  document.getElementById('topbar-sub').textContent = 'Crea un proyecto y clónale su checklist';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-nuevo-proyecto');
  document.getElementById('np-error').textContent = '';
  document.getElementById('np-success').textContent = '';
}

async function crearProyecto(){
  const errEl = document.getElementById('np-error');
  const okEl = document.getElementById('np-success');
  const btn = document.getElementById('np-submit-btn');
  errEl.textContent = ''; okEl.textContent = '';

  const datos = {
    codigo: document.getElementById('np-codigo').value.trim(),
    nombre: document.getElementById('np-nombre').value.trim(),
    cliente: document.getElementById('np-cliente').value.trim(),
    plantilla: document.getElementById('np-plantilla').value,
    estado: document.getElementById('np-estado').value,
    director: document.getElementById('np-director').value.trim(),
    residente: document.getElementById('np-residente').value.trim(),
    gerente: document.getElementById('np-gerente').value.trim(),
    carpetaDrive: document.getElementById('np-drive').value.trim()
  };
  if(!datos.codigo || !datos.nombre){
    errEl.textContent = 'El código y el nombre del proyecto son obligatorios.';
    return;
  }
  btn.disabled = true; btn.textContent = 'Creando...';
  try{
    const s = getSession();
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'crear_proyecto', token: s.token, datos })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    okEl.textContent = '✓ Proyecto creado' + (data.checklist && data.checklist.filas_creadas ? ' con ' + data.checklist.filas_creadas + ' ítems de checklist.' : '.');
    ['np-codigo','np-nombre','np-cliente','np-director','np-residente','np-gerente','np-drive'].forEach(id => document.getElementById(id).value = '');
    setTimeout(goToProjectList, 1500);
  }catch(e){
    errEl.textContent = '⚠ ' + e.message;
  }
  btn.disabled = false; btn.textContent = 'Crear proyecto';
}

let allMyProjects = [];
let currentProjectStatusFilter = 'todos';

async function loadProjects(){
  const note = document.getElementById('load-note');
  const grid = document.getElementById('projects-grid');
  note.style.display = 'block'; note.className = 'load-note';
  note.textContent = '⏳ Cargando tus proyectos...';
  try{
    const s = getSession();
    const res = await fetch(API_URL + '?action=proyectos&token=' + encodeURIComponent(s.token));
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    note.style.display = 'none';
    allMyProjects = data.proyectos;
    currentProjectStatusFilter = 'todos';
    renderProjectStatusTabs();
    renderProjects(allMyProjects);
    precalentarCarpetasEnSegundoPlano(allMyProjects);
  }catch(e){
    handleSessionError_(note, 'No se pudo cargar tus proyectos: ' + e.message);
    grid.innerHTML = '';
  }
}

/* ═══ PRECALENTADO DE CACHÉ EN SEGUNDO PLANO ═══
   Apenas se carga "Mis proyectos", se dispara en silencio el escaneo de
   Drive de cada proyecto (sin bloquear la pantalla ni esperar respuesta).
   El caché del backend es COMPARTIDO entre todos los que usan el portal
   (dura 6 horas) — con que UNA persona deje esto corriendo de fondo un
   rato, después todos entran instantáneo a cualquier proyecto. Se hace de
   a pocos a la vez (no todos en paralelo) para no saturar Apps Script. */
let _precalentando = false;
async function precalentarCarpetasEnSegundoPlano(proyectos){
  if(_precalentando) return; // evita relanzar si ya hay uno corriendo
  _precalentando = true;
  const CONCURRENCIA = 2;
  const s = getSession();
  const cola = [...proyectos];
  const banner = document.getElementById('precarga-banner');
  let restantes = cola.length;
  function actualizarBanner(){
    if(!banner) return;
    if(restantes <= 0){ banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    banner.textContent = '🔄 Precargando datos de Drive en segundo plano... (' + (cola.length - restantes + 1) + '/' + cola.length + ' — puedes seguir usando el portal mientras tanto)';
  }
  async function trabajador(){
    while(cola.length){
      const p = cola.shift();
      actualizarBanner();
      try{
        await fetch(API_URL + '?action=checklist_proyecto&token=' + encodeURIComponent(s.token) + '&codigo=' + encodeURIComponent(p.codigo));
      }catch(e){ /* si uno falla, no importa — se sigue con los demás */ }
      restantes--;
      actualizarBanner();
    }
  }
  const workers = [];
  for(let i=0;i<CONCURRENCIA;i++) workers.push(trabajador());
  await Promise.all(workers);
  _precalentando = false;
  actualizarBanner();
}

function renderProjectStatusTabs(){
  const wrap = document.getElementById('projects-status-tabs');
  const counts = {};
  allMyProjects.forEach(p => { const e = p.estado || 'Sin estado'; counts[e] = (counts[e]||0) + 1; });
  const estados = Object.keys(counts).sort();
  const tabs = [{key:'todos', label:'Todos', n: allMyProjects.length}]
    .concat(estados.map(e => ({key:e, label:e, n:counts[e]})));
  wrap.innerHTML = tabs.map(t => `<button class="status-tab ${currentProjectStatusFilter===t.key?'active':''}" onclick="filterProjectsByStatus('${t.key.replace(/'/g,"\\'")}')">${t.label} (${t.n})</button>`).join('');
}

function filterProjectsByStatus(estado){
  currentProjectStatusFilter = estado;
  renderProjectStatusTabs();
  const filtered = estado === 'todos' ? allMyProjects : allMyProjects.filter(p => (p.estado || 'Sin estado') === estado);
  renderProjects(filtered);
}

function renderProjects(proyectos){
  const grid = document.getElementById('projects-grid');
  if(!proyectos.length){
    grid.innerHTML = '<div class="projects-empty">No tienes proyectos asignados todavía. Si crees que es un error, contacta a quien administra el portal.</div>';
    return;
  }
  grid.innerHTML = proyectos.map(p => {
    const roles = [];
    if(p.director) roles.push('Director: ' + p.director);
    if(p.residente) roles.push('Residente: ' + p.residente);
    if(p.gerente) roles.push('Gerente: ' + p.gerente);
    return `
    <div class="project-card" onclick='openProject(${JSON.stringify(p)})'>
      <div class="pc-codigo">${p.codigo}${p.estado ? ' · ' + p.estado : ''}</div>
      <div class="pc-nombre">${p.nombre}</div>
      <div class="pc-cliente">${p.cliente || ''}</div>
      <div class="pc-roles">${roles.map(r=>`<span class="pc-role-tag">${r}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

let currentProjSubtab = 'documental';

function openProject(p){
  currentProject = p;
  currentView = 'timeline';
  currentFaseIndex = 0;
  currentCarpetaIndex = 0;
  currentProjSubtab = 'documental';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-timeline').style.display = 'block';
  document.getElementById('refresh-btn').style.display = 'inline-block';
  setActiveNav('nav-mis-proyectos');
  document.getElementById('topbar-title').textContent = p.codigo;
  document.getElementById('topbar-sub').textContent = p.nombre;
  document.getElementById('project-header').innerHTML = `
    <div>
      <div class="ph-codigo">${p.codigo}${p.cliente ? ' · ' + p.cliente : ''}</div>
      <div class="ph-nombre">${p.nombre}</div>
    </div>
    ${p.carpetaDrive ? `<a class="ph-drive" href="${p.carpetaDrive}" target="_blank" rel="noopener">📁 Abrir carpeta en Drive</a>` : ''}
  `;
  switchProjSubtab('documental');
  loadProjectChecklist(p.codigo);
  renderResumenGeneral(p.codigo);
}

function switchProjSubtab(name){
  currentProjSubtab = name;
  ['documental','fases','resumen'].forEach(n => {
    document.getElementById('subview-' + n).style.display = (n === name) ? 'block' : 'none';
    document.getElementById('subtab-' + n).classList.toggle('active', n === name);
  });
}

let _checklistRequestId = 0;

async function loadProjectChecklist(codigo){
  const note = document.getElementById('load-note');
  const driveNote = document.getElementById('drive-scan-note');
  note.style.display = 'block'; note.className = 'load-note';
  note.textContent = '⏳ Cargando checklist del proyecto... (puede tardar hasta 1 minuto la primera vez que se revisa la carpeta de Drive de este proyecto)';
  driveNote.style.display = 'none';
  const miRequestId = ++_checklistRequestId; // si se navega a otro proyecto antes de que esto responda, esta respuesta se descarta
  try{
    const s = getSession();
    const res = await fetch(API_URL + '?action=checklist_proyecto&token=' + encodeURIComponent(s.token) + '&codigo=' + encodeURIComponent(codigo));
    const data = await res.json();
    // Si mientras esperábamos la respuesta el usuario ya cambió de proyecto
    // (o de vista), o esta respuesta ya no es la más reciente, se ignora
    // por completo para no pisar lo que se está viendo ahora.
    if(miRequestId !== _checklistRequestId || currentView !== 'timeline' || !currentProject || currentProject.codigo !== codigo) return;
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    note.style.display = 'none';
    window._fasesData = data.fases;
    window._resumenData = data.resumen;
    window._carpetasData = agruparPorCarpeta_(data.fases);
    if(data.driveScanError){
      driveNote.style.display = 'block';
      driveNote.textContent = '⚠ ' + data.driveScanError + ' El estado "Archivo cargado" puede salir como "sin verificar" para algunos ítems.';
    }
    renderFaseSidebar(data.fases, data.resumen);
    renderFaseDetail(FASE_ORDER[currentFaseIndex]);
    renderCarpetaSidebar(window._carpetasData);
    renderCarpetaDetail(CARPETA_ORDER[currentCarpetaIndex]);
  }catch(e){
    if(miRequestId !== _checklistRequestId) return;
    handleSessionError_(note, 'No se pudo cargar el checklist: ' + e.message);
    document.getElementById('proj-fase-sidebar').innerHTML = '';
    document.getElementById('fase-detail-wrap').innerHTML = '';
    document.getElementById('proj-carpeta-sidebar').innerHTML = '';
    document.getElementById('carpeta-detail-wrap').innerHTML = '';
  }
}

/* ═══ CONTROL DOCUMENTAL — agrupado por carpeta base (no por fase) ═══
   HSE se deja como recordatorio visual de un desarrollo futuro: no se
   clona en el checklist (ver Code.gs), así que aquí siempre aparece
   deshabilitada con la etiqueta "Próximamente". */
const CARPETA_ORDER = ['1. CLIENTE','2. CONTRATISTAS Y COMPRAS','3. HSE','4. SEGUIMIENTO Y CONTROL','5. GARANTÍAS'];
const CARPETA_LABELS = {
  '1. CLIENTE':'Cliente',
  '2. CONTRATISTAS Y COMPRAS':'Contratistas y Compras',
  '3. HSE':'HSE',
  '4. SEGUIMIENTO Y CONTROL':'Seguimiento y Control',
  '5. GARANTÍAS':'Garantías'
};
let currentCarpetaIndex = 0;

function agruparPorCarpeta_(fasesData){
  const porCarpeta = {};
  CARPETA_ORDER.forEach(c => porCarpeta[c] = []);
  Object.values(fasesData || {}).forEach(lista => {
    (lista || []).forEach(it => {
      const clave = (it.carpetaBase || '').trim().toUpperCase();
      const match = CARPETA_ORDER.find(c => clave.indexOf(c.split('. ')[1]) !== -1 || clave === c);
      if(match) porCarpeta[match].push(it);
      else {
        if(!porCarpeta['_otros']) porCarpeta['_otros'] = [];
        porCarpeta['_otros'].push(it);
      }
    });
  });
  return porCarpeta;
}

function renderCarpetaSidebar(carpetas){
  const wrap = document.getElementById('proj-carpeta-sidebar');
  wrap.innerHTML = CARPETA_ORDER.map((carpeta, idx) => {
    const esHSE = carpeta === '3. HSE';
    const items = carpetas[carpeta] || [];
    const total = items.length;
    const hechos = items.filter(it => it.check).length;
    const pct = total ? Math.round(100 * hechos / total) : 0;
    const done = total > 0 && hechos === total;
    if(esHSE){
      return `
        <div class="pf-node disabled" title="Pendiente de desarrollo">
          <div class="pf-circle">🚧</div>
          <div class="pf-info">
            <div class="pf-label">${CARPETA_LABELS[carpeta]} <span class="pf-soon-tag">Próximamente</span></div>
            <div class="pf-pct">Aún no se controla en el portal</div>
          </div>
        </div>`;
    }
    const cls = (idx === currentCarpetaIndex ? 'active' : '') + (done ? ' done' : '');
    return `
      <div class="pf-node ${cls}" onclick="selectCarpeta(${idx})">
        <div class="pf-circle">${done ? '✓' : idx+1}</div>
        <div class="pf-info">
          <div class="pf-label">${CARPETA_LABELS[carpeta]}</div>
          <div class="pf-pct">${hechos}/${total} completos (${pct}%)</div>
        </div>
      </div>`;
  }).join('');
}

function selectCarpeta(idx){
  currentCarpetaIndex = idx;
  renderCarpetaSidebar(window._carpetasData);
  renderCarpetaDetail(CARPETA_ORDER[idx]);
}

function renderCarpetaDetail(carpeta){
  const items = (window._carpetasData && window._carpetasData[carpeta]) || [];
  const wrap = document.getElementById('carpeta-detail-wrap');
  if(carpeta === '3. HSE'){
    wrap.innerHTML = `
      <div class="fase-detail-head"><div class="fase-detail-title">HSE</div></div>
      <div class="fase-empty">Esta carpeta está reservada para un desarrollo futuro — todavía no se controla documentalmente desde el portal.</div>`;
    return;
  }
  const s = getSession();
  const puedeDarVistoBueno = s.rol === 'Calidad' || s.rol === 'Gerente' || s.rol === 'Admin';
  function renderItem(it){
    const calidadBtns = puedeDarVistoBueno ? `
      <div class="calidad-actions">
        <button class="calidad-btn aprobar" onclick="marcarVistoBueno(${it.rowIndex}, 'Aprobado')">Aprobar</button>
        <button class="calidad-btn rechazar" onclick="marcarVistoBueno(${it.rowIndex}, 'Rechazado')">Rechazar</button>
      </div>` : '';
    return `
    <div class="fase-item">
      <div class="body">
        <div class="sub">${it.subcarpeta}</div>
        <div class="doc">${it.documento || ''}</div>
      </div>
      <div class="resp">${it.responsable}</div>
      <div class="fase-item-status">
        ${estadoArchivoPill_(it.archivoCargado, it.archivoUrl)}
        ${estadoCalidadPill_(it.vistoBueno)}
        ${calidadBtns}
      </div>
    </div>`;
  }
  // Agrupa por subcarpeta intermedia (el mismo nivel que ves al navegar Drive,
  // ej. "1. Administrativo", "2. Contable"...). Si un ítem no tiene grupo
  // asignado (checklists creados antes de esta función), cae en "General".
  const grupos = {};
  const ordenGrupos = [];
  items.forEach(it => {
    const g = it.grupo || 'General';
    if(!grupos[g]){ grupos[g] = []; ordenGrupos.push(g); }
    grupos[g].push(it);
  });
  ordenGrupos.sort((a,b) => a.localeCompare(b, 'es', {numeric:true}));

  const itemsHtml = items.length ? ordenGrupos.map(g => `
    <div class="grupo-subheader">${g}</div>
    ${grupos[g].map(renderItem).join('')}
  `).join('') : '<div class="fase-empty">Sin ítems clasificados en esta carpeta.</div>';
  const total = items.length, hechos = items.filter(it=>it.check).length;
  wrap.innerHTML = `
    <div class="fase-detail-head">
      <div class="fase-detail-title">${CARPETA_LABELS[carpeta]}</div>
      <div class="fase-detail-count">${hechos}/${total} completos</div>
    </div>
    ${itemsHtml}`;
}

/* ═══ RESUMEN GENERAL DE PROYECTO — datos reales del Sheet de Control
   General de Proyectos (el mismo de Flujo de Caja), buscados por código.
   Si el proyecto no existe ahí todavía (por ejemplo, se creó solo en el
   Portal y no en ese Sheet), se avisa en vez de inventar datos. ═══ */
let curvaSChart;
function renderResumenGeneral(codigo){
  const note = document.getElementById('resumen-proyecto-note');
  const headerEl = document.getElementById('ficha-header');
  const kpisEl = document.getElementById('ficha-kpis');
  const healthEl = document.getElementById('ficha-health');
  const curvaNota = document.getElementById('resumen-curva-nota');
  const p = PROJECTS.find(x => x.codigo === codigo);
  if(!p){
    note.style.display = 'block';
    note.className = 'load-note error';
    note.textContent = '⚠ Este proyecto no se encontró en el Sheet de "Control General de Proyectos" — puede que se haya creado solo en este portal. No hay datos financieros/de avance para mostrar todavía.';
    headerEl.style.display = 'none'; kpisEl.innerHTML = ''; healthEl.innerHTML = '';
    document.getElementById('cronograma-list').innerHTML = '';
    document.getElementById('presupuesto-caps').innerHTML = '';
    if(curvaSChart){ curvaSChart.destroy(); curvaSChart = null; }
    curvaNota.style.display = 'none';
    return;
  }
  note.style.display = 'none';
  headerEl.style.display = 'grid';

  const cls = EB[p.estado] || 'eb-cerr';
  const salud = Math.round(((p.avObra||0)*0.4) + ((p.avLiq||0)*0.3) + 60*0.3);
  headerEl.innerHTML = `
    <div>
      <div class="ficha-codigo">${p.codigo}</div>
      <div class="ficha-nombre">${p.proyecto}</div>
      <div class="ficha-meta">
        <div class="ficha-meta-item">Cliente: <span>${p.cliente||'—'}</span></div>
        <div class="ficha-meta-item">Director: <span>${p.encargado||'—'}</span></div>
        <div class="ficha-meta-item">Ciudad: <span>${p.ciudad||'—'}</span></div>
        <div class="ficha-meta-item">Sector: <span>${p.sector||'—'}</span></div>
        <div class="ficha-meta-item">Estado: <span><span class="estado-badge ${cls}" style="font-size:10px">${p.estado}</span></span></div>
      </div>
    </div>
    <div class="ficha-salud">
      <div class="ficha-salud-n" style="color:${hCol(salud)}">${salud}</div>
      <div class="ficha-salud-l">Índice de salud /100</div>
    </div>`;

  const kpiData = [
    {v: fmtMM(p.valor), l:'Valor del contrato', pct:100, c:'#1a1a1a'},
    {v: fmtMM(p.vPagado), l:'Facturado', pct: p.valor ? Math.round((p.vPagado||0)/p.valor*100) : 0, c:'#1a8a52'},
    {v: fmtMM(p.pxCobrar), l:'Pendiente cobrar', pct: p.valor ? Math.round((p.pxCobrar||0)/p.valor*100) : 0, c:'#c0392b'},
    {v: (p.avObra||0)+'%', l:'Avance de obra', pct: p.avObra||0, c: hCol(p.avObra||0)},
    {v: fmtPct(p.difSNpct), l:'Diferencia SN', pct: Math.min(p.difSNpct||0,100), c: (p.difSNpct||0)>35?'#c0392b':(p.difSNpct||0)>25?'#c08a00':'#1a8a52'},
  ];
  kpisEl.innerHTML = kpiData.map(k => `
    <div class="ficha-kpi">
      <div class="ficha-kpi-v">${k.v}</div>
      <div class="ficha-kpi-l">${k.l}</div>
      <div class="ficha-kpi-bar"><div class="ficha-kpi-bar-fill" style="width:${k.pct}%;background:${k.c}"></div></div>
    </div>`).join('');

  const healthItems = [
    {lbl:'Cronograma', pct: p.avObra>=80?85:p.avObra>=50?70:50},
    {lbl:'Financiero', pct: (p.difSNpct||0)<25?85:(p.difSNpct||0)<35?65:45},
    {lbl:'Cartera', pct: p.pxCobrar===0?95:p.pxCobrar<p.valor*0.3?70:45},
    {lbl:'Calidad', pct: p.obs && p.obs.length>5 ? 60 : 85},
  ];
  healthEl.innerHTML = healthItems.map(h => `<div class="health-row"><div class="health-lbl">${h.lbl}</div><div class="hbar-bg"><div class="hbar-fill" style="width:${h.pct}%;background:${hCol(h.pct)}"></div></div><div class="health-pct" style="color:${hCol(h.pct)}">${h.pct}%</div><div class="hdot" style="background:${hCol(h.pct)}"></div></div>`).join('')
    + `<div style="font-size:9px;color:#a09c96;margin-top:6px">HSE: pendiente de desarrollo (ver pestaña Control documental)</div>`;

  // ── Curva S: usa datos reales si existen para este código (PROJ_DETAIL);
  // si no, muestra una aproximación genérica basada solo en el % de avance
  // actual, dejándolo explícito con un aviso — nunca se presenta como real.
  if(curvaSChart) curvaSChart.destroy();
  const det = PROJ_DETAIL[p.codigo];
  let labels, planData, realData;
  if(det && det.curvaS && det.curvaS.length){
    curvaNota.style.display = 'none';
    labels = det.curvaS.map(d=>d.s);
    planData = det.curvaS.map(d=>d.prog);
    realData = det.curvaS.map(d=>d.real);
  } else {
    curvaNota.style.display = 'block';
    curvaNota.className = 'load-note';
    curvaNota.textContent = '⚠ Aproximación — todavía no hay datos históricos semana a semana para este proyecto en el Sheet, así que esta curva es una estimación basada solo en el % de avance actual.';
    const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const avReal = p.avObra||0;
    const mActual = new Date().getMonth();
    labels = meses;
    planData = meses.map((_,i)=>Math.min(100,Math.round((i/(meses.length-1))*100)));
    realData = meses.map((_,i)=>{ if(i>mActual) return null; const r=Math.round((i/Math.max(mActual,1))*avReal); return Math.min(r,avReal); });
    realData[mActual] = avReal;
  }
  curvaSChart = new Chart(document.getElementById('curvaSChart'), {type:'line', data:{labels, datasets:[
    {label:'Planeado', data:planData, borderColor:'#1a5fa5', borderDash:[5,4], borderWidth:2, pointRadius:3, pointBackgroundColor:'#1a5fa5', tension:0.4, fill:false},
    {label:'Real', data:realData, borderColor:'#e8622a', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#e8622a', tension:0.4, fill:false},
  ]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, labels:{font:{size:10}, boxWidth:16, padding:12}}, tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw!=null?ctx.raw+'%':'—'}`}}}, scales:{x:{grid:{display:false}, ticks:{color:'#6b6b66',font:{size:10}}, border:{display:false}}, y:{min:0,max:100, grid:{color:'#f0efec'}, ticks:{color:'#6b6b66',font:{size:10}, callback:v=>v+'%'}, border:{display:false}}}}
  });

  // ── Cronograma y Presupuesto por capítulo: SIEMPRE de muestra (CAPS es un
  // listado genérico, no datos reales de ningún proyecto) — el aviso ya
  // está fijo en el HTML de esta sección, y aquí igual queda claro.
  const pctBase = p.avObra||0;
  const caps = CAPS.map((c,i)=>{ const variacion=(i%3===0?-8:i%3===1?5:-2); return {...c, pct: Math.max(0,Math.min(100, pctBase+variacion+(i*3%15-7)))}; });
  document.getElementById('cronograma-list').innerHTML = `<table class="cronograma-table"><thead><tr>
    <th>Cap.</th><th>Descripción</th><th style="min-width:120px">Avance</th><th style="text-align:right">Selección</th></tr></thead><tbody>
    ${caps.map(c=>`<tr>
      <td class="cap-num">${c.n}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:18px;border-radius:4px;background:${c.color}22;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">${c.ico}</div><span style="font-size:11px;font-weight:600;color:${c.color}">${c.nom}</span></div></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="cap-bar-wrap" style="flex:1"><div class="cap-bar-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
          <span class="cap-pct">${Math.round(c.pct)}%</span>
        </div>
      </td>
      <td style="text-align:right"><div style="display:inline-block;background:${c.color}22;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:600;color:${c.color}">Alcance</div></td>
    </tr>`).join('')}
  </tbody></table>`;

  const totalMonto = CAPS.reduce((a,c)=>a+c.monto,0);
  const factor = p.valor>0 ? p.valor/1e6/totalMonto : 1;
  document.getElementById('presupuesto-caps').innerHTML = CAPS.map(c=>{
    const monto = Math.round(c.monto*factor);
    const pct = Math.round(c.monto/totalMonto*100);
    return `<div class="cap-row">
      <div class="cap-icon" style="background:${c.color}22;color:${c.color}">${c.ico}</div>
      <div class="cap-info">
        <div class="cap-info-top">
          <span class="cap-info-label" style="color:${c.color}">${c.n} — ${c.nom}</span>
          <span class="cap-info-monto">$${monto.toLocaleString()} M</span>
        </div>
        <div class="cap-info-sub">${pct}% del presupuesto total · $${c.monto.toLocaleString()}/m²</div>
        <div class="cap-bar-mini"><div class="cap-bar-mini-fill" style="width:${pct}%;background:${c.color}"></div></div>
      </div>
    </div>`;
  }).join('');
}

function renderFaseSidebar(fases, resumen){
  const wrap = document.getElementById('proj-fase-sidebar');
  wrap.innerHTML = FASE_ORDER.map((fase, idx) => {
    const r = resumen[fase] || {total:0, hechos:0};
    const pct = r.total ? Math.round(100 * r.hechos / r.total) : 0;
    const done = r.total > 0 && r.hechos === r.total;
    const cls = (idx === currentFaseIndex ? 'active' : '') + (done ? ' done' : '');
    return `
      <div class="pf-node ${cls}" onclick="selectFase(${idx})">
        <div class="pf-circle">${done ? '✓' : idx+1}</div>
        <div class="pf-info">
          <div class="pf-label">${fase}</div>
          <div class="pf-pct">${r.hechos}/${r.total} completos (${pct}%)</div>
        </div>
      </div>`;
  }).join('');
}

function selectFase(idx){
  currentFaseIndex = idx;
  renderFaseSidebar(window._fasesData, window._resumenData);
  renderFaseDetail(FASE_ORDER[idx]);
}

function estadoArchivoPill_(archivoCargado, archivoUrl){
  const openAttr = archivoUrl ? ` onclick="window.open('${archivoUrl}','_blank')" style="cursor:pointer" title="Abrir carpeta en Drive"` : '';
  if(archivoCargado === true) return `<span class="status-pill ok"${openAttr}>📎 Archivo cargado${archivoUrl?' ↗':''}</span>`;
  if(archivoCargado === false) return `<span class="status-pill no"${openAttr}>📎 Sin archivo${archivoUrl?' ↗':''}</span>`;
  return '<span class="status-pill unknown">📎 Sin verificar</span>';
}

function estadoCalidadPill_(vistoBueno){
  if(vistoBueno === 'Aprobado') return '<span class="status-pill ok">✅ Aprobado</span>';
  if(vistoBueno === 'Rechazado') return '<span class="status-pill rechazado">✅ Rechazado</span>';
  return '<span class="status-pill pend">✅ Pendiente</span>';
}

function renderFaseDetail(fase){
  const items = (window._fasesData && window._fasesData[fase]) || [];
  const r = (window._resumenData && window._resumenData[fase]) || {total:0, hechos:0};
  const wrap = document.getElementById('fase-detail-wrap');
  const s = getSession();
  const puedeDarVistoBueno = s.rol === 'Calidad' || s.rol === 'Gerente' || s.rol === 'Admin';
  const itemsHtml = items.length ? items.map(it => {
    const calidadBtns = puedeDarVistoBueno ? `
      <div class="calidad-actions">
        <button class="calidad-btn aprobar" onclick="marcarVistoBueno(${it.rowIndex}, 'Aprobado')">Aprobar</button>
        <button class="calidad-btn rechazar" onclick="marcarVistoBueno(${it.rowIndex}, 'Rechazado')">Rechazar</button>
      </div>` : '';
    return `
    <div class="fase-item">
      <div class="body">
        <div class="carpeta">${it.carpetaBase}</div>
        <div class="sub">${it.subcarpeta}</div>
        <div class="doc">${it.documento || ''}</div>
      </div>
      <div class="resp">${it.responsable}</div>
      <div class="fase-item-status">
        ${estadoArchivoPill_(it.archivoCargado, it.archivoUrl)}
        ${estadoCalidadPill_(it.vistoBueno)}
        ${calidadBtns}
      </div>
    </div>`;
  }).join('') : '<div class="fase-empty">Sin ítems clasificados en esta fase.</div>';
  wrap.innerHTML = `
    <div class="fase-detail-head">
      <div class="fase-detail-title">${fase}</div>
      <div class="fase-detail-count">${r.hechos}/${r.total} completos</div>
    </div>
    ${itemsHtml}`;
}

async function marcarVistoBueno(rowIndex, estado){
  const s = getSession();
  try{
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'marcar_visto_bueno', token: s.token, codigo: currentProject.codigo, rowIndex, estado })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    loadProjectChecklist(currentProject.codigo);
  }catch(e){
    alert('No se pudo actualizar el Visto Bueno: ' + e.message);
  }
}

document.addEventListener('DOMContentLoaded', function(){
  const s = getSession();
  if(s.nombre && s.token){ enterApp(); }
  ['login-correo','login-pass'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', function(e){
      if(e.key === 'Enter') doLogin();
    });
  });
});