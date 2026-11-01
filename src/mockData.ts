import { 
  Employee, 
  Vehicle, 
  VehicleMaintenance, 
  GeneralExpense, 
  ServiceOrder, 
  DirectSale,
  InitialSetupCostItem,
  Client,
  Supplier,
  Product,
  StockMovement,
  CardMachineRate,
  CustomerPortalTicket,
  AuditLog,
  CompanySettings,
  ServiceCatalogItem,
  ChecklistTemplate,
  CardOperator,
  PagBankTransaction,
  SequenceSettings,
  WarrantyPolicy
} from './types';

export const initialClients: Client[] = [
  {
    id: 'cli-maria-gorete',
    personType: 'PF',
    name: 'Maria Gorete',
    document: '619.998.442-41',
    rg: '1.890.342 SSP/DF',
    contactPerson: 'Maria Gorete',
    email: 'mariagorete@email.com',
    phone: '61999844241',
    secondaryPhone: '(61) 99860-1113',
    cep: '72300-500',
    street: 'QI 5 Conjunto 7',
    number: 'Casa 13',
    neighborhood: 'Samambaia Sul (Samambaia)',
    city: 'Brasília',
    state: 'DF',
    createdAt: '2026-05-09',
    addresses: [
      {
        id: 'addr-mg-1',
        title: 'Residência com Piscina Aquecida',
        isDefault: true,
        cep: '72300-500',
        street: 'QI 5 Conjunto 7',
        number: 'Casa 13',
        neighborhood: 'Samambaia Sul',
        city: 'Brasília',
        state: 'DF',
        referencePoint: 'Próximo à Quadra QR 114'
      }
    ]
  },
  {
    id: 'cli-1',
    personType: 'PJ',
    name: 'Condomínio Residencial Bella Vista',
    tradeName: 'Cond. Bella Vista',
    document: '08.123.456/0001-02',
    stateRegistration: 'Isento',
    contactPerson: 'Síndico Marcos Vinicius',
    email: 'administracao@bellavista.condo.br',
    phone: '(11) 4567-8901',
    secondaryPhone: '(11) 97100-2233',
    cep: '05652-000',
    street: 'Alameda dos Ipês',
    number: '300',
    neighborhood: 'Morumbi',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2024-03-12',
    addresses: [
      {
        id: 'addr-1-1',
        title: 'Sede / Portaria Social',
        isDefault: true,
        cep: '05652-000',
        street: 'Alameda dos Ipês',
        number: '300',
        complement: 'Bloco A',
        neighborhood: 'Morumbi',
        city: 'São Paulo',
        state: 'SP',
        referencePoint: 'Em frente à praça principal'
      },
      {
        id: 'addr-1-2',
        title: 'Central Térmica / Portaria de Carga',
        isDefault: false,
        cep: '05652-010',
        street: 'Rua das Camélias',
        number: '120',
        complement: 'Subsolo Casa de Máquinas',
        neighborhood: 'Morumbi',
        city: 'São Paulo',
        state: 'SP',
        referencePoint: 'Acesso lateral para caminhões e peças pesadas'
      }
    ]
  },
  {
    id: 'cli-2',
    personType: 'PJ',
    name: 'Metalúrgica Precision Ltda',
    tradeName: 'Precision Usinagem',
    document: '14.829.102/0001-90',
    stateRegistration: '635.882.110.114',
    contactPerson: 'Engº Carlos Eduardo',
    email: 'compras@precisionmetal.com.br',
    phone: '(11) 3344-9988',
    cep: '09015-000',
    street: 'Av. das Indústrias',
    number: '1420',
    complement: 'Galpão 3',
    neighborhood: 'Campestre',
    city: 'Santo André',
    state: 'SP',
    createdAt: '2024-05-20',
    addresses: [
      {
        id: 'addr-2-1',
        title: 'Fábrica / Galpão 3 (Recepção de Peças)',
        isDefault: true,
        cep: '09015-000',
        street: 'Av. das Indústrias',
        number: '1420',
        complement: 'Galpão 3',
        neighborhood: 'Campestre',
        city: 'Santo André',
        state: 'SP',
        referencePoint: 'Distrito Industrial do Campestre'
      },
      {
        id: 'addr-2-2',
        title: 'Escritório Administrativo / Financeiro',
        isDefault: false,
        cep: '09080-100',
        street: 'Rua das Figueiras',
        number: '450',
        complement: 'Sala 102',
        neighborhood: 'Bairro Jardim',
        city: 'Santo André',
        state: 'SP',
        referencePoint: 'Próximo ao Parque Celso Daniel'
      }
    ]
  },
  {
    id: 'cli-3',
    personType: 'PJ',
    name: 'Supermercado Nova Estrela Ltda',
    tradeName: 'Super Nova Estrela',
    document: '29.341.562/0002-14',
    stateRegistration: '541.229.088.001',
    contactPerson: 'Gerente Roberto Dias',
    email: 'manutencao@novaestrela.com.br',
    phone: '(11) 2233-1122',
    cep: '09710-000',
    street: 'Rua das Palmeiras',
    number: '850',
    neighborhood: 'Centro',
    city: 'São Bernardo do Campo',
    state: 'SP',
    createdAt: '2024-08-15',
    addresses: [
      {
        id: 'addr-3-1',
        title: 'Loja 01 (Matriz Centro)',
        isDefault: true,
        cep: '09710-000',
        street: 'Rua das Palmeiras',
        number: '850',
        neighborhood: 'Centro',
        city: 'São Bernardo do Campo',
        state: 'SP',
        referencePoint: 'Em frente à Igreja Matriz'
      },
      {
        id: 'addr-3-2',
        title: 'Centro de Distribuição / Depósito',
        isDefault: false,
        cep: '09850-550',
        street: 'Estrada dos Alvarengas',
        number: '3200',
        neighborhood: 'Alvarenga',
        city: 'São Bernardo do Campo',
        state: 'SP',
        referencePoint: 'Próximo à Rodovia dos Imigrantes'
      }
    ]
  },
  {
    id: 'cli-4',
    personType: 'PF',
    name: 'Dr. Roberto Camargo',
    tradeName: 'Clínica Dr. Roberto',
    document: '182.903.481-99',
    rg: '28.910.345-X SSP/SP',
    birthDate: '1978-04-14',
    email: 'roberto.camargo@clinica.med.br',
    phone: '(11) 99123-5566',
    secondaryPhone: '(11) 3088-4422',
    cep: '01405-001',
    street: 'Rua Pamplona',
    number: '900',
    complement: 'Conjunto 82',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    createdAt: '2024-09-02',
    addresses: [
      {
        id: 'addr-4-1',
        title: 'Consultório Principal (Jardins)',
        isDefault: true,
        cep: '01405-001',
        street: 'Rua Pamplona',
        number: '900',
        complement: 'Conjunto 82',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        referencePoint: 'Esquina com Alameda Santos'
      },
      {
        id: 'addr-4-2',
        title: 'Residência Particular (Moema)',
        isDefault: false,
        cep: '04515-010',
        street: 'Avenida Juriti',
        number: '550',
        complement: 'Casa 2',
        neighborhood: 'Moema Pássaros',
        city: 'São Paulo',
        state: 'SP',
        referencePoint: 'Próximo ao Parque Ibirapuera'
      },
      {
        id: 'addr-4-3',
        title: 'Chácara de Lazer (Aquecedor Solar Piscina)',
        isDefault: false,
        cep: '13300-000',
        street: 'Estrada Municipal do Pinhal',
        number: 'S/N - Km 4',
        neighborhood: 'Zona Rural',
        city: 'Itu',
        state: 'SP',
        referencePoint: 'Condomínio Fazenda Vila Real - Lote 45'
      }
    ]
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'TermoMax Indústria de Reservatórios Térmicos Ltda',
    tradeName: 'TermoMax Boilers & Solar',
    cnpj: '61.423.789/0001-15',
    email: 'vendas@termomax.ind.br',
    phone: '(19) 3822-4400',
    cep: '13080-000',
    street: 'Rodovia Campinas-Mogi Mirim',
    number: 's/n, km 118',
    city: 'Campinas',
    state: 'SP',
    notes: 'Fornecedor principal de reservatórios térmicos (boilers) inox 304 e 316'
  },
  {
    id: 'sup-2',
    name: 'Bombas HidroSchneider Equipamentos S/A',
    tradeName: 'Schneider MotoBombas',
    cnpj: '84.112.334/0001-52',
    email: 'pedidos@schneiderbombas.com.br',
    phone: '(47) 3451-9000',
    cep: '89201-000',
    street: 'Rua das Máquinas Industriais',
    number: '550',
    city: 'Joinville',
    state: 'SC',
    notes: 'Bombas centrífugas, pressurizadores e motores elétricos'
  },
  {
    id: 'sup-3',
    name: 'Distribuidora HidroSolar Peças & Conexões',
    tradeName: 'HidroSolar Tubos & Válvulas',
    cnpj: '03.882.109/0001-77',
    email: 'atendimento@hidrosolar.com.br',
    phone: '(11) 3221-8899',
    cep: '03010-000',
    street: 'Rua Florêncio de Abreu',
    number: '1250',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Válvulas de alívio, conexões de cobre e latão, tubos PPR'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'BOIL-600-AP',
    name: 'Reservatório Térmico Boiler 600L Alta Pressão Inox 316',
    category: 'Reservatórios Térmicos',
    costPrice: 3850.00,
    retailPrice: 5900.00,
    wholesalePrice: 5200.00,
    currentStock: 4,
    minStock: 2,
    unit: 'UN',
    ncm: '8419.19.10',
    icmsRate: 12.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  },
  {
    id: 'prod-2',
    code: 'BOIL-400-BP',
    name: 'Reservatório Térmico Boiler 400L Baixa Pressão Inox 304',
    category: 'Reservatórios Térmicos',
    costPrice: 2450.00,
    retailPrice: 3800.00,
    wholesalePrice: 3350.00,
    currentStock: 6,
    minStock: 3,
    unit: 'UN',
    ncm: '8419.19.10',
    icmsRate: 12.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  },
  {
    id: 'prod-3',
    code: 'BOM-SCH-3CV',
    name: 'Bomba Centrífuga Schneider 3CV Trifásica 220/380V',
    category: 'Bombas e Motores',
    costPrice: 1650.00,
    retailPrice: 2800.00,
    wholesalePrice: 2400.00,
    currentStock: 5,
    minStock: 2,
    unit: 'UN',
    ncm: '8413.70.80',
    icmsRate: 18.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  },
  {
    id: 'prod-4',
    code: 'VAL-ALIV-3B',
    name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar',
    category: 'Tubulações e Conexões',
    costPrice: 65.00,
    retailPrice: 160.00,
    wholesalePrice: 120.00,
    currentStock: 28,
    minStock: 10,
    unit: 'PC',
    ncm: '8481.40.00',
    icmsRate: 18.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  },
  {
    id: 'prod-5',
    code: 'CTRL-CDT-DIG',
    name: 'Controlador Diferencial de Temperatura (CDT) Digital Full Gauge',
    category: 'Insumos Elétricos',
    costPrice: 190.00,
    retailPrice: 390.00,
    wholesalePrice: 320.00,
    currentStock: 12,
    minStock: 4,
    unit: 'UN',
    ncm: '9032.10.90',
    icmsRate: 18.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  },
  {
    id: 'prod-6',
    code: 'RESIST-3000W',
    name: 'Resistência Elétrica Blindada de Apoio 3000W 220V em Inox',
    category: 'Peças Gerais',
    costPrice: 95.00,
    retailPrice: 220.00,
    wholesalePrice: 175.00,
    currentStock: 18,
    minStock: 6,
    unit: 'PC',
    ncm: '8516.80.10',
    icmsRate: 18.0,
    pisRate: 1.65,
    cofinsRate: 7.6
  }
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'sm-1',
    productId: 'prod-1',
    productName: 'Reservatório Térmico Boiler 600L Alta Pressão Inox 316',
    type: 'entrada_xml',
    quantity: 5,
    unitCost: 3850.00,
    date: '2026-10-01',
    referenceDoc: 'NF-e 18924 / TermoMax Indústria',
    notes: 'Entrada automática via importação de XML'
  },
  {
    id: 'sm-2',
    productId: 'prod-1',
    productName: 'Reservatório Térmico Boiler 600L Alta Pressão Inox 316',
    type: 'saida_os',
    quantity: 1,
    unitCost: 3850.00,
    date: '2026-10-12',
    referenceDoc: 'OS-2026-103',
    notes: 'Aplicação em manutenção de reservatório'
  },
  {
    id: 'sm-3',
    productId: 'prod-3',
    productName: 'Bomba Centrífuga Schneider 3CV Trifásica 220/380V',
    type: 'entrada_xml',
    quantity: 6,
    unitCost: 1650.00,
    date: '2026-10-03',
    referenceDoc: 'NF-e 44901 / Schneider MotoBombas',
    notes: 'Aquisição para reposição de estoque'
  }
];

export const initialCardRates: CardMachineRate[] = [
  { brand: 'visa', debitRate: 1.25, creditSightRate: 2.85, creditInstallmentsRate: 4.50 },
  { brand: 'mastercard', debitRate: 1.25, creditSightRate: 2.85, creditInstallmentsRate: 4.50 },
  { brand: 'elo', debitRate: 1.60, creditSightRate: 3.40, creditInstallmentsRate: 5.20 },
  { brand: 'hipercard', debitRate: 1.70, creditSightRate: 3.50, creditInstallmentsRate: 5.40 },
  { brand: 'outra', debitRate: 1.80, creditSightRate: 3.60, creditInstallmentsRate: 5.50 }
];

export const initialCardOperators: CardOperator[] = [
  {
    id: 'op-pagbank',
    name: 'PagBank (PagSeguro UOL)',
    code: 'pagbank',
    cnpj: '08.561.701/0001-01',
    type: 'maquininha',
    active: true,
    settlementTermDays: 1, // D+1 útil na conta PagBank
    pixRate: 0.00, // Pix taxa 0% no PagBank
    debitRate: 1.99, // 1.99% Débito
    creditSightRate: 3.19, // 3.19% Crédito à Vista
    creditInstallments2to6Rate: 3.79, // 3.79% Crédito 2x a 6x
    creditInstallments7to12Rate: 4.99, // 4.99% Crédito 7x a 12x
    anticipationRate: 1.20, // Taxa de antecipação automática
    acceptedBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Alelo'],
    integration: {
      enabled: true,
      environment: 'production',
      apiToken: 'pagbank_sec_live_9981a8c049d214ee8812c3b889a',
      publicKey: 'PUB_KEY_PAGBANK_MPPISCINA_2026_RSA_2048',
      webhookUrl: 'https://api.mppiscina.com.br/webhooks/pagbank/ipn',
      webhookSecret: 'whsec_99a812bf0034a1ce',
      autoReconcile: true,
      lastSyncAt: '2026-11-01 07:30',
      status: 'connected',
      autoNotifyClientWhatsapp: true
    },
    notes: 'Operadora principal MP PISCINA para Maquininha Smart Pro e Links de Pagamento com baixa automática no ERP e repasse em D+1.',
    createdAt: '2024-03-01'
  },
  {
    id: 'op-cielo',
    name: 'Cielo Soluções de Pagamento',
    code: 'cielo',
    cnpj: '01.027.058/0001-91',
    type: 'maquininha',
    active: true,
    settlementTermDays: 30,
    pixRate: 0.99,
    debitRate: 1.49,
    creditSightRate: 2.75,
    creditInstallments2to6Rate: 3.89,
    creditInstallments7to12Rate: 5.10,
    anticipationRate: 1.99,
    acceptedBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex'],
    integration: {
      enabled: false,
      environment: 'production',
      apiToken: '',
      webhookUrl: 'https://api.mppiscina.com.br/webhooks/cielo',
      autoReconcile: false,
      status: 'disconnected'
    },
    notes: 'Operadora secundária de contingência.',
    createdAt: '2024-01-15'
  },
  {
    id: 'op-stone',
    name: 'Stone Pagamentos',
    code: 'stone',
    cnpj: '16.501.555/0001-57',
    type: 'maquininha',
    active: false,
    settlementTermDays: 1,
    pixRate: 0.00,
    debitRate: 1.35,
    creditSightRate: 2.90,
    creditInstallments2to6Rate: 3.65,
    creditInstallments7to12Rate: 4.85,
    anticipationRate: 1.40,
    acceptedBrands: ['Visa', 'Mastercard', 'Elo', 'Hipercard'],
    integration: {
      enabled: false,
      environment: 'production',
      apiToken: '',
      webhookUrl: 'https://api.mppiscina.com.br/webhooks/stone',
      autoReconcile: false,
      status: 'disconnected'
    },
    notes: 'Cadastro homologado para eventual ativação.',
    createdAt: '2024-05-10'
  }
];

export const initialPagBankTransactions: PagBankTransaction[] = [
  {
    id: 'pbtx-1',
    transactionCode: 'PAG-2025020327-01',
    operatorId: 'op-pagbank',
    orderId: 'os-maria-gorete-2025020327',
    orderCode: '2025020327',
    clientName: 'Maria Gorete',
    paymentMethod: 'cartao_credito',
    installments: 3,
    brand: 'Mastercard',
    grossAmount: 5990.00,
    feePercentage: 3.79,
    feeAmount: 227.02,
    netAmount: 5762.98,
    status: 'PAID',
    paidAt: '2026-11-01 07:15:32',
    reconciled: true,
    reconciledAt: '2026-11-01 07:15:33',
    nsu: '984120394',
    authorizationCode: 'AU8912'
  },
  {
    id: 'pbtx-2',
    transactionCode: 'PAG-2026-103-01',
    operatorId: 'op-pagbank',
    orderCode: 'OS-2026-103',
    clientName: 'Antônio Carlos Prado',
    paymentMethod: 'pix',
    installments: 1,
    brand: 'Pix',
    grossAmount: 1850.00,
    feePercentage: 0.00,
    feeAmount: 0.00,
    netAmount: 1850.00,
    status: 'PAID',
    paidAt: '2026-10-31 16:40:11',
    reconciled: true,
    reconciledAt: '2026-10-31 16:40:12',
    nsu: '774120993',
    authorizationCode: 'PX4490'
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-hugo-gandy',
    name: 'Hugo Gandy',
    role: 'Técnico Especialista em Piscinas & Aquecimento',
    email: 'mppiscina2004@gmail.com',
    phone: '(61) 99860-1113',
    baseSalary: 4500,
    benefitsCharges: 1550,
    commissionRate: 10,
    status: 'Ativo',
    admissionDate: '2024-01-10'
  },
  {
    id: 'emp-1',
    name: 'Carlos Alberto Silva',
    role: 'Técnico Sênior de Campo',
    email: 'carlos.silva@gestaopro.com.br',
    phone: '(11) 98765-4321',
    baseSalary: 3800,
    benefitsCharges: 1420,
    commissionRate: 8,
    assignedVehicleId: 'veh-1',
    status: 'Ativo',
    admissionDate: '2024-02-15'
  },
  {
    id: 'emp-2',
    name: 'Marcos Vinícius Souza',
    role: 'Técnico de Instalação e Manutenção',
    email: 'marcos.souza@gestaopro.com.br',
    phone: '(11) 97654-3210',
    baseSalary: 2900,
    benefitsCharges: 1100,
    commissionRate: 6,
    assignedVehicleId: 'veh-2',
    status: 'Ativo',
    admissionDate: '2024-06-10'
  },
  {
    id: 'emp-3',
    name: 'Lucas Rocha dos Santos',
    role: 'Técnico Assistente / Mecânico',
    email: 'lucas.rocha@gestaopro.com.br',
    phone: '(11) 96543-2109',
    baseSalary: 2200,
    benefitsCharges: 850,
    commissionRate: 5,
    assignedVehicleId: 'veh-3',
    status: 'Ativo',
    admissionDate: '2025-01-20'
  },
  {
    id: 'emp-4',
    name: 'Juliana Mendes Nogueira',
    role: 'Consultora de Vendas & Atendimento',
    email: 'juliana.mendes@gestaopro.com.br',
    phone: '(11) 95432-1098',
    baseSalary: 2700,
    benefitsCharges: 980,
    commissionRate: 4,
    status: 'Ativo',
    admissionDate: '2024-04-01'
  }
];

export const initialVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    model: 'Fiat Strada 1.4 Hard Working Cabine Plus',
    plate: 'BRA-2E19',
    year: 2022,
    currentKm: 48650,
    assignedEmployeeId: 'emp-1',
    status: 'Operacional',
    nextOilChangeKm: 50000,
    annualIpvaValue: 1980,
    annualInsuranceValue: 2450
  },
  {
    id: 'veh-2',
    model: 'VW Saveiro Robust 1.6 Flex',
    plate: 'QNY-7A31',
    year: 2021,
    currentKm: 63200,
    assignedEmployeeId: 'emp-2',
    status: 'Operacional',
    nextOilChangeKm: 65000,
    annualIpvaValue: 1840,
    annualInsuranceValue: 2200
  },
  {
    id: 'veh-3',
    model: 'Fiat Fiorino Endurance 1.4',
    plate: 'RIO-4D22',
    year: 2023,
    currentKm: 31400,
    assignedEmployeeId: 'emp-3',
    status: 'Operacional',
    nextOilChangeKm: 35000,
    annualIpvaValue: 2150,
    annualInsuranceValue: 2600
  }
];

export const initialVehicleExpenses: VehicleMaintenance[] = [
  {
    id: 'vm-1',
    vehicleId: 'veh-1',
    employeeId: 'emp-1',
    category: 'combustivel',
    description: 'Abastecimento 45L Gasolina Comum - Rota Campinas/SP',
    cost: 269.55,
    date: '2026-10-04',
    kmAtService: 47200,
    litersFuel: 45,
    workshopOrSupplier: 'Posto Shell RodoAnel',
    paymentMethod: 'cartao_debito'
  },
  {
    id: 'vm-2',
    vehicleId: 'veh-1',
    employeeId: 'emp-1',
    category: 'combustivel',
    description: 'Abastecimento 42L Gasolina Comum - Rotas Centrais',
    cost: 247.80,
    date: '2026-10-14',
    kmAtService: 47900,
    litersFuel: 42,
    workshopOrSupplier: 'Posto Ipiranga Av. Brasil',
    paymentMethod: 'pix'
  },
  {
    id: 'vm-3',
    vehicleId: 'veh-1',
    employeeId: 'emp-1',
    category: 'pastilhas_freio',
    description: 'Substituição do jogo de pastilhas dianteiras Fras-le + fluido DOT4',
    cost: 380.00,
    date: '2026-10-18',
    kmAtService: 48100,
    workshopOrSupplier: 'Auto Center Freios & Cia',
    paymentMethod: 'pix'
  },
  {
    id: 'vm-4',
    vehicleId: 'veh-2',
    employeeId: 'emp-2',
    category: 'combustivel',
    description: 'Abastecimento 48L Gasolina Comum - Atendimentos Zona Leste',
    cost: 283.20,
    date: '2026-10-06',
    kmAtService: 62100,
    litersFuel: 48,
    workshopOrSupplier: 'Posto Shell Radial',
    paymentMethod: 'pix'
  },
  {
    id: 'vm-5',
    vehicleId: 'veh-2',
    employeeId: 'emp-2',
    category: 'troca_oleo',
    description: 'Troca de Óleo 5W40 Castrol Magnatec + Filtro de combustível',
    cost: 310.00,
    date: '2026-10-15',
    kmAtService: 62500,
    workshopOrSupplier: 'Oficina Alemão Motores',
    paymentMethod: 'pix'
  },
  {
    id: 'vm-6',
    vehicleId: 'veh-3',
    employeeId: 'emp-3',
    category: 'combustivel',
    description: 'Abastecimento 40L Gasolina Comum - Entregas de peças e chamados',
    cost: 236.00,
    date: '2026-10-08',
    kmAtService: 30800,
    litersFuel: 40,
    workshopOrSupplier: 'Posto BR Castelo',
    paymentMethod: 'pix'
  }
];

export const initialGeneralExpenses: GeneralExpense[] = [
  {
    id: 'ge-1',
    category: 'aluguel',
    description: 'Aluguel do Imóvel Comercial / Galpão Operacional',
    cost: 3850.00,
    dueDate: '2026-10-10',
    paymentDate: '2026-10-09',
    isPaid: true,
    isRecurring: true,
    supplier: 'Imobiliária Nova Aliança'
  },
  {
    id: 'ge-2',
    category: 'internet',
    description: 'Internet Fibra Óptica 600 Mbps Dedicada + Linha Fixa',
    cost: 219.90,
    dueDate: '2026-10-15',
    paymentDate: '2026-10-14',
    isPaid: true,
    isRecurring: true,
    supplier: 'Vivo Empresas Fibra'
  },
  {
    id: 'ge-3',
    category: 'celular',
    description: 'Conta Celular Corporativo Técnico Carlos Silva',
    cost: 79.90,
    dueDate: '2026-10-20',
    paymentDate: '2026-10-19',
    isPaid: true,
    employeeId: 'emp-1',
    isRecurring: true,
    supplier: 'Claro Corporativo Móvel'
  },
  {
    id: 'ge-4',
    category: 'celular',
    description: 'Conta Celular Corporativo Técnico Marcos Souza',
    cost: 79.90,
    dueDate: '2026-10-20',
    paymentDate: '2026-10-19',
    isPaid: true,
    employeeId: 'emp-2',
    isRecurring: true,
    supplier: 'Claro Corporativo Móvel'
  },
  {
    id: 'ge-5',
    category: 'alimentacao',
    description: 'Reembolso Alimentação em Campo - Carlos Silva (Atendimento externo)',
    cost: 240.00,
    dueDate: '2026-10-16',
    paymentDate: '2026-10-16',
    isPaid: true,
    employeeId: 'emp-1',
    isRecurring: false,
    supplier: 'Restaurante & Conveniência Rota'
  },
  {
    id: 'ge-6',
    category: 'energia_agua',
    description: 'Conta de Energia Elétrica da Base Operacional',
    cost: 540.30,
    dueDate: '2026-10-18',
    paymentDate: '2026-10-17',
    isPaid: true,
    isRecurring: true,
    supplier: 'Enel Distribuição SP'
  },
  {
    id: 'ge-7',
    category: 'software_contabilidade',
    description: 'Honorários de Assessoria Contábil Mensal',
    cost: 850.00,
    dueDate: '2026-10-10',
    paymentDate: '2026-10-10',
    isPaid: true,
    isRecurring: true,
    supplier: 'Escritório Contábil Progresso'
  },
  {
    id: 'ge-8',
    category: 'compra_produtos_xml',
    description: 'Compra Fornecedor TermoMax NF-e 18924 (Duplicata 1/2)',
    cost: 9625.00,
    dueDate: '2026-11-05',
    isPaid: false,
    supplierId: 'sup-1',
    supplier: 'TermoMax Indústria de Reservatórios Térmicos',
    invoiceNumber: 'NF-e 18924',
    isRecurring: false
  }
];

export const initialServiceOrders: ServiceOrder[] = [
  {
    id: 'os-pdf-2025020327',
    code: '2025020327',
    clientId: 'cli-maria-gorete',
    clientName: 'Maria Gorete',
    clientDocument: '619.998.442-41',
    clientPhone: '61999844241',
    clientAddress: 'QI 5 Conjunto 7, Casa 13 - Samambaia Sul, Brasília / DF',
    employeeId: 'emp-hugo-gandy',
    kmDriven: 15,
    status: 'aprovada_em_andamento',
    openDate: '2026-05-09',
    forecastDate: '2026-05-17',
    equipmentType: 'Multi estruturas Concreto Azul claro',
    equipmentModel: 'Aquecedor & Sistema de Filtragem',
    equipmentSerial: 'SN-MP-2025-09',
    warrantyPeriodDays: 365,
    warrantyExpiresAt: '2027-05-17',
    visitFee: 0,
    description: 'Aquecimento da Piscina',
    services: [
      { id: 'srv-mg-1', name: 'Instalação do filtro de piscina c/ areia', hours: 1, price: 580.00 },
      { id: 'srv-mg-2', name: 'Instalação do Trocador de calor', hours: 1, price: 1250.00 }
    ],
    parts: [
      { id: 'prt-mg-1', name: 'Trocador RB 80 Rheem 220v ( até 100 m3) - Rheem', cost: 14500, price: 18500.00, quantity: 1, unit: 'UN' },
      { id: 'prt-mg-2', name: 'Filtro DFR-19 s/bomba s/areia 100KG - DANCOR', cost: 890, price: 1116.90, quantity: 1, unit: 'UN' },
      { id: 'prt-mg-3', name: 'Bomba Dancor PF 17 (1 CV) monofásica - DANCOR', cost: 1150, price: 1470.00, quantity: 1, unit: 'UN' },
      { id: 'prt-mg-4', name: 'Areia p/ filtro saco 25kl - Erga', cost: 35, price: 55.00, quantity: 4, unit: 'SC' }
    ],
    discountType: 'fixed',
    discountValue: 0,
    calculatedDiscount: 0,
    paymentMethod: 'pix',
    payments: [],
    paymentStatus: 'pendente',
    checklists: [
      { id: 'chk-mg-1', label: 'Dreno fundo', category: 'Estrutura e Tanque', status: 'ok', notes: 'Conforme' },
      { id: 'chk-mg-2', label: 'Retorno', category: 'Hidráulica e Pressão', status: 'ok', notes: 'Conforme' },
      { id: 'chk-mg-3', label: 'Tubulações de ida e volta p/ Aquec.', category: 'Hidráulica e Pressão', status: 'ok', notes: 'Tubulação 50mm' },
      { id: 'chk-mg-4', label: 'Cabos adequados', category: 'Elétrica e Comando', status: 'ok', notes: 'Bitola 10mm²' },
      { id: 'chk-mg-5', label: 'Teste de funcionamento do aquec', category: 'Acessórios e Segurança', status: 'nao_aplicavel', notes: 'Aguardando instalação' },
      { id: 'chk-mg-6', label: 'Controlador testado', category: 'Elétrica e Comando', status: 'nao_aplicavel', notes: 'Aguardando ligação' },
      { id: 'chk-mg-7', label: 'Bomba funcionando', category: 'Hidráulica e Pressão', status: 'nao_aplicavel', notes: 'Aguardando término da hidráulica' }
    ],
    entryPhotos: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80'
    ],
    exitPhotos: [],
    notes: 'Cliente solicitou prazo de garantia de 365 dias para os trocadores e filtros novos instalados.'
  },
  {
    id: 'os-1',
    code: 'OS-2026-101',
    clientId: 'cli-2',
    clientName: 'Metalúrgica Precision Ltda',
    clientDocument: '14.829.102/0001-90',
    clientPhone: '(11) 3344-9988',
    clientAddress: 'Av. das Indústrias, 1420 - Galpão 3, Santo André/SP',
    employeeId: 'emp-1',
    vehicleId: 'veh-1',
    kmDriven: 110,
    status: 'entregue_finalizada',
    openDate: '2026-10-02',
    forecastDate: '2026-10-04',
    completionDate: '2026-10-03',
    equipmentType: 'Compressor Parafuso & Linha Pneumática',
    equipmentModel: 'Schulz SRP 4030',
    equipmentSerial: 'SN-SCH-90218',
    equipmentYear: '2022',
    warrantyPeriodDays: 90,
    warrantyExpiresAt: '2027-01-03',
    visitFee: 150,
    description: 'Manutenção preventiva e corretiva em compressor parafuso e sistema pneumático central.',
    services: [
      { id: 'srv-1', name: 'Revisão geral do sistema de compressão', hours: 6, price: 1850 },
      { id: 'srv-2', name: 'Calibração de válvulas e sensores de pressão', hours: 3, price: 950 }
    ],
    parts: [
      { id: 'prt-1', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', cost: 130, price: 320, quantity: 2, unit: 'PC' },
      { id: 'prt-2', name: 'Elemento Filtrante de Ar e Óleo', cost: 380, price: 750, quantity: 1, unit: 'UN' }
    ],
    discountType: 'fixed',
    discountValue: 100,
    calculatedDiscount: 100,
    paymentMethod: 'pix',
    payments: [
      {
        id: 'pay-1',
        method: 'pix',
        amount: 3920.00,
        netAmount: 3920.00
      }
    ],
    paymentStatus: 'pago',
    checklists: [
      {
        id: 'chk-1',
        label: 'Inspeção visual de estanqueidade e vazamentos',
        category: 'Hidráulica e Pressão',
        status: 'ok',
        notes: 'Sem vazamentos detectados na linha'
      },
      {
        id: 'chk-2',
        label: 'Aferição de corrente e relé térmico de proteção',
        category: 'Elétrica e Comando',
        status: 'ok',
        notes: 'Corrente nominal estável em 28A'
      },
      {
        id: 'chk-3',
        label: 'Condição da válvula de alívio e segurança',
        category: 'Acessórios e Segurança',
        status: 'defeito',
        notes: 'Válvula travada, substituída por nova de 3 bar'
      }
    ],
    entryPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
    ],
    exitPhotos: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80'
    ],
    signature: {
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10 90 35 T 180 30" stroke="%231d4ed8" fill="none" stroke-width="2"/></svg>',
      signedByName: 'Rodrigo Albuquerque (Gerente Fabril)',
      signedByDocument: '28.910.234-8',
      signedAt: '2026-10-03 16:45'
    },
    notes: 'Serviço aprovado e pago no ato via Pix com recibo emitido.'
  },
  {
    id: 'os-2',
    code: 'OS-2026-102',
    clientId: 'cli-1',
    clientName: 'Condomínio Residencial Bella Vista',
    clientDocument: '08.123.456/0001-02',
    clientPhone: '(11) 4567-8901',
    clientAddress: 'Alameda dos Ipês, 300 - Morumbi, São Paulo/SP',
    employeeId: 'emp-1',
    vehicleId: 'veh-1',
    kmDriven: 140,
    status: 'entregue_finalizada',
    openDate: '2026-10-12',
    forecastDate: '2026-10-15',
    completionDate: '2026-10-14',
    equipmentType: 'Sistema de Reservatório Térmico Solar Central',
    equipmentModel: 'TermoMax Boiler 600L Inox 316',
    equipmentSerial: 'TMX-2024-8841',
    equipmentYear: '2024',
    warrantyPeriodDays: 365,
    warrantyExpiresAt: '2027-10-14',
    visitFee: 180,
    description: 'Substituição de resistência de apoio, sensor de temperatura e balanceamento do sistema térmico.',
    services: [
      { id: 'srv-3', name: 'Troca de resistência e vedação em boiler inox', hours: 4, price: 1200 },
      { id: 'srv-4', name: 'Parametrização de termostato CDT e testes', hours: 2, price: 600 }
    ],
    parts: [
      { id: 'prt-3', productId: 'prod-6', name: 'Resistência Elétrica Blindada 3000W 220V', cost: 190, price: 440, quantity: 2, unit: 'PC' },
      { id: 'prt-4', productId: 'prod-5', name: 'Controlador Diferencial de Temperatura (CDT)', cost: 190, price: 390, quantity: 1, unit: 'UN' }
    ],
    discountType: 'fixed',
    discountValue: 150,
    calculatedDiscount: 150,
    paymentMethod: 'cartao_credito',
    payments: [
      {
        id: 'pay-2',
        method: 'cartao_credito',
        cardBrand: 'visa',
        installments: 3,
        ratePercentage: 4.5,
        rateAmount: 119.70,
        amount: 2660.00,
        netAmount: 2540.30
      }
    ],
    paymentStatus: 'pago',
    checklists: [
      {
        id: 'chk-4',
        label: 'Verificação do isolamento térmico e integridade do tanque',
        category: 'Estrutura e Tanque',
        status: 'ok',
        notes: 'Isolamento de poliuretano intacto sem corrosão'
      },
      {
        id: 'chk-5',
        label: 'Inspeção do ânodo de sacrifício de magnésio',
        category: 'Estrutura e Tanque',
        status: 'ok'
      },
      {
        id: 'chk-6',
        label: 'Aterramento da carcaça e proteção diferencial residual (DR)',
        category: 'Elétrica e Comando',
        status: 'ok'
      }
    ],
    entryPhotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'
    ],
    exitPhotos: [
      'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=400&q=80'
    ],
    signature: {
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M15 35 C 40 10, 65 50, 110 25 S 170 45, 190 30" stroke="%231e293b" fill="none" stroke-width="2"/></svg>',
      signedByName: 'Antônio Prado (Síndico)',
      signedByDocument: '14.209.845-1',
      signedAt: '2026-10-14 17:10'
    }
  },
  {
    id: 'os-3',
    code: 'OS-2026-103',
    clientId: 'cli-3',
    clientName: 'Supermercado Nova Estrela Ltda',
    clientDocument: '29.341.562/0002-14',
    clientPhone: '(11) 2233-1122',
    clientAddress: 'Rua das Palmeiras, 850 - Centro, São Bernardo do Campo/SP',
    employeeId: 'emp-2',
    vehicleId: 'veh-2',
    kmDriven: 80,
    status: 'aprovada_em_andamento',
    openDate: '2026-10-26',
    forecastDate: '2026-10-31',
    equipmentType: 'Bomba de Recalque e Pressurização',
    equipmentModel: 'Schneider 3CV',
    equipmentSerial: 'SCH-88310',
    equipmentYear: '2023',
    warrantyPeriodDays: 90,
    visitFee: 120,
    description: 'Manutenção preventiva em conjunto moto-bomba de água gelada.',
    services: [
      { id: 'srv-5', name: 'Desmontagem e substituição de selo mecânico e rolamentos', hours: 5, price: 1450 }
    ],
    parts: [
      { id: 'prt-5', name: 'Jogo de Rolamentos SKF 6205', cost: 120, price: 290, quantity: 2, unit: 'PC' },
      { id: 'prt-6', name: 'Selo Mecânico 1.1/4" Carbeto de Silício', cost: 160, price: 380, quantity: 1, unit: 'PC' }
    ],
    discountType: 'percent',
    discountValue: 5,
    calculatedDiscount: 126.50,
    paymentMethod: 'faturado_30d',
    payments: [],
    paymentStatus: 'pendente',
    checklists: [
      {
        id: 'chk-7',
        label: 'Inspeção de folga axial e ruído em mancais',
        category: 'Estrutura e Tanque',
        status: 'defeito',
        notes: 'Ruído excessivo no mancal dianteiro'
      }
    ],
    entryPhotos: [],
    exitPhotos: []
  },
  {
    id: 'os-4',
    code: 'OS-2026-104',
    clientId: 'cli-4',
    clientName: 'Dr. Roberto Camargo',
    clientDocument: '182.903.481-99',
    clientPhone: '(11) 99123-5566',
    clientAddress: 'Rua Pamplona, 900 - Conjunto 82, Jardins, São Paulo/SP',
    employeeId: 'emp-3',
    vehicleId: 'veh-3',
    kmDriven: 45,
    status: 'aguardando_pecas',
    openDate: '2026-10-10',
    forecastDate: '2026-10-18', // EM ATRASO (previsão expirada)
    equipmentType: 'Aquecedor Solar a Vácuo Acoplado 300L',
    equipmentModel: 'Heliotek Vacuo 30 Tubos',
    equipmentSerial: 'HLT-VAC-7740',
    equipmentYear: '2023',
    warrantyPeriodDays: 90,
    visitFee: 140,
    description: 'Vazamento em barrilete de alimentação e necessidade de troca de tubos a vácuo borosilicato.',
    services: [
      { id: 'srv-6', name: 'Desobstrução e reparo de barrilete hidráulico', hours: 3, price: 890 }
    ],
    parts: [
      { id: 'prt-7', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', cost: 130, price: 320, quantity: 1, unit: 'PC' },
      { id: 'prt-8', name: 'Tubo de Vácuo Solar Borosilicato 58x1800mm', cost: 75, price: 185, quantity: 4, unit: 'UN' }
    ],
    discountType: 'fixed',
    discountValue: 50,
    calculatedDiscount: 50,
    paymentMethod: 'pix',
    payments: [],
    paymentStatus: 'pendente',
    checklists: [
      {
        id: 'chk-8',
        label: 'Verificação de tubos a vácuo e choque térmico',
        category: 'Estrutura e Tanque',
        status: 'defeito',
        notes: '2 tubos trincados por granizo ou choque térmico'
      }
    ],
    entryPhotos: [],
    exitPhotos: [],
    notes: 'Aguardando chegada de lote de tubos a vácuo do fornecedor. Prazo estourado.'
  },
  {
    id: 'os-5',
    code: 'OS-2026-105',
    clientId: 'cli-1',
    clientName: 'Condomínio Residencial Bella Vista',
    clientDocument: '08.123.456/0001-02',
    clientPhone: '(11) 4567-8901',
    clientAddress: 'Alameda dos Ipês, 300 - Morumbi, São Paulo/SP',
    employeeId: 'emp-1',
    vehicleId: 'veh-1',
    kmDriven: 90,
    status: 'concluida_aguardando_retirada',
    openDate: '2026-10-20',
    forecastDate: '2026-10-24',
    completionDate: '2026-10-23',
    equipmentType: 'Válvula Redutora e Conjunto Hidráulico',
    equipmentModel: 'Bermad 720',
    equipmentSerial: 'BMD-9901',
    equipmentYear: '2022',
    warrantyPeriodDays: 180,
    warrantyExpiresAt: '2027-04-23',
    visitFee: 160,
    description: 'Recondicionamento de piloto e membrana de válvula redutora de pressão.',
    services: [
      { id: 'srv-7', name: 'Recondicionamento de válvula redutora de pressão', hours: 4, price: 1100 }
    ],
    parts: [
      { id: 'prt-9', name: 'Kit Reparo de Membrana e O-rings 2"', cost: 180, price: 420, quantity: 1, unit: 'PC' }
    ],
    discountType: 'fixed',
    discountValue: 0,
    calculatedDiscount: 0,
    paymentMethod: 'boleto',
    payments: [],
    paymentStatus: 'pendente',
    checklists: [],
    entryPhotos: [],
    exitPhotos: []
  },
  {
    id: 'os-6',
    code: 'OS-2026-092',
    clientId: 'cli-2',
    clientName: 'Metalúrgica Precision Ltda',
    clientDocument: '14.829.102/0001-90',
    clientPhone: '(11) 3344-9988',
    clientAddress: 'Av. das Indústrias, 1420 - Galpão 3, Santo André/SP',
    employeeId: 'emp-2',
    vehicleId: 'veh-2',
    kmDriven: 120,
    status: 'entregue_finalizada',
    openDate: '2026-09-15',
    forecastDate: '2026-09-18',
    completionDate: '2026-09-17',
    equipmentType: 'Boiler Industrial 1000L',
    equipmentModel: 'TermoMax Ind 1000L',
    equipmentSerial: 'TMX-IND-004',
    equipmentYear: '2023',
    warrantyPeriodDays: 365,
    visitFee: 200,
    description: 'Manutenção semestral preventiva e desincrustação química.',
    services: [
      { id: 'srv-8', name: 'Desincrustação química e limpeza de reservatório térmico', hours: 8, price: 2400 }
    ],
    parts: [
      { id: 'prt-10', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', cost: 130, price: 320, quantity: 1, unit: 'PC' }
    ],
    discountType: 'fixed',
    discountValue: 100,
    calculatedDiscount: 100,
    paymentMethod: 'pix',
    payments: [
      { id: 'pay-6', method: 'pix', amount: 2820.00, netAmount: 2820.00 }
    ],
    paymentStatus: 'pago',
    checklists: [],
    entryPhotos: [],
    exitPhotos: []
  }
];

export const initialDirectSales: DirectSale[] = [
  {
    id: 'sale-1',
    code: 'VD-2026-041',
    clientId: 'cli-1',
    clientName: 'Condomínio Residencial Bella Vista',
    employeeId: 'emp-4',
    date: '2026-10-05',
    priceType: 'varejo',
    items: [
      { id: 'sit-1', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', quantity: 4, cost: 65, price: 160, unit: 'PC' },
      { id: 'sit-2', productId: 'prod-6', name: 'Resistência Elétrica Blindada 3000W 220V', quantity: 2, cost: 95, price: 220, unit: 'PC' }
    ],
    discountType: 'fixed',
    discountValue: 80,
    calculatedDiscount: 80,
    total: 1000.00,
    paymentMethod: 'pix',
    payments: [
      { id: 'ps-1', method: 'pix', amount: 500, netAmount: 500 },
      { id: 'ps-2', method: 'cartao_debito', cardBrand: 'mastercard', ratePercentage: 1.25, rateAmount: 6.25, amount: 500, netAmount: 493.75 }
    ],
    paymentStatus: 'pago'
  },
  {
    id: 'sale-2',
    code: 'VD-2026-042',
    clientId: 'cli-2',
    clientName: 'Metalúrgica Precision Ltda',
    employeeId: 'emp-4',
    date: '2026-10-18',
    priceType: 'atacado',
    items: [
      { id: 'sit-3', productId: 'prod-1', name: 'Reservatório Térmico Boiler 600L Alta Pressão Inox 316', quantity: 1, cost: 3850, price: 5200, unit: 'UN' }
    ],
    discountType: 'percent',
    discountValue: 0,
    calculatedDiscount: 0,
    total: 5200.00,
    paymentMethod: 'cartao_credito',
    payments: [
      { id: 'ps-3', method: 'cartao_credito', cardBrand: 'visa', installments: 6, ratePercentage: 4.5, rateAmount: 234.00, amount: 5200.00, netAmount: 4966.00 }
    ],
    paymentStatus: 'pago'
  },
  {
    id: 'sale-3',
    code: 'VD-2026-043',
    clientId: 'cli-3',
    clientName: 'Supermercado Nova Estrela Ltda',
    employeeId: 'emp-4',
    date: '2026-10-24',
    priceType: 'varejo',
    items: [
      { id: 'sit-4', productId: 'prod-5', name: 'Controlador Diferencial de Temperatura (CDT)', quantity: 2, cost: 190, price: 390, unit: 'UN' },
      { id: 'sit-5', productId: 'prod-4', name: 'Válvula de Segurança e Alívio de Pressão 3/4" 3 Bar', quantity: 3, cost: 65, price: 160, unit: 'PC' }
    ],
    discountType: 'fixed',
    discountValue: 60,
    calculatedDiscount: 60,
    total: 1200.00,
    paymentMethod: 'pix',
    payments: [
      { id: 'ps-4', method: 'pix', amount: 1200, netAmount: 1200 }
    ],
    paymentStatus: 'pago'
  },
  {
    id: 'sale-4',
    code: 'VD-2026-039',
    clientId: 'cli-1',
    clientName: 'Condomínio Residencial Bella Vista',
    employeeId: 'emp-4',
    date: '2026-09-20',
    priceType: 'varejo',
    items: [
      { id: 'sit-6', productId: 'prod-2', name: 'Reservatório Térmico Boiler 400L Baixa Pressão Inox 304', quantity: 1, cost: 2450, price: 3890, unit: 'UN' }
    ],
    discountType: 'percent',
    discountValue: 5,
    calculatedDiscount: 194.50,
    total: 3695.50,
    paymentMethod: 'cartao_credito',
    payments: [
      { id: 'ps-5', method: 'cartao_credito', amount: 3695.50, netAmount: 3529.20 }
    ],
    paymentStatus: 'pago'
  }
];

export const initialCustomerTickets: CustomerPortalTicket[] = [
  {
    id: 'tkt-1',
    clientId: 'cli-1',
    clientName: 'Condomínio Residencial Bella Vista',
    serviceOrderId: 'os-2',
    equipmentSerial: 'TMX-2024-8841',
    type: 'acionamento_garantia',
    subject: 'Oscilação na temperatura do Boiler Bloco B',
    description: 'Após a manutenção do dia 14/10, o visor do controlador digital indicou código de advertência E02 no período da manhã. Solicitamos revisão técnica em garantia.',
    status: 'visita_agendada',
    priority: 'alta',
    createdAt: '2026-10-25 09:30',
    scheduledDate: '2026-10-31'
  },
  {
    id: 'tkt-2',
    clientId: 'cli-4',
    clientName: 'Dr. Roberto Camargo (Clínica Médica)',
    type: 'chamado_tecnico',
    subject: 'Orçamento para instalação de reservatório térmico 400L',
    description: 'Precisamos de visita técnica para avaliar o telhado e viabilidade de instalação de aquecimento solar para consultórios.',
    status: 'aberto',
    priority: 'normal',
    createdAt: '2026-10-29 14:15'
  }
];

export const initialSetupCosts: InitialSetupCostItem[] = [
  {
    id: 'sc-1',
    category: 'Ferramental & Equipamentos',
    name: 'Kit de Ferramentas Especiais e Maletas Profissionais (3 kits)',
    estimatedCost: 12000,
    actualCost: 11500,
    status: 'adquirido',
    date: '2024-01-10',
    notes: 'Kits completos com multímetros Fluke, furadeiras/parafusadeiras Dewalt, alicates amperímetros e torquímetros.'
  },
  {
    id: 'sc-2',
    category: 'Capital de Giro Inicial',
    name: 'Reserva de Liquidez para Capital de Giro (3 meses de custos fixos)',
    estimatedCost: 35000,
    actualCost: 35000,
    status: 'adquirido',
    date: '2024-01-15',
    notes: 'Suporte de caixa para fluxo de pagamento a fornecedores e folha inicial.'
  },
  {
    id: 'sc-3',
    category: 'Estrutura & Ponto Comercial',
    name: 'Caução de Locação do Galpão (3 meses)',
    estimatedCost: 11550,
    actualCost: 11550,
    status: 'adquirido',
    date: '2024-01-20',
    notes: 'Garantia locatícia depositada em conta caução imobiliária.'
  },
  {
    id: 'sc-4',
    category: 'Estrutura & Ponto Comercial',
    name: 'Reforma do Galpão, Pintura Epóxi e Bancadas Industriais',
    estimatedCost: 8500,
    actualCost: 7900,
    status: 'adquirido',
    date: '2024-01-25'
  },
  {
    id: 'sc-5',
    category: 'Frota & Mobilidade',
    name: 'Entrada e Adesivação Visual da Frota Operacional',
    estimatedCost: 15000,
    actualCost: 14800,
    status: 'adquirido',
    date: '2024-02-01'
  },
  {
    id: 'sc-6',
    category: 'TI & Softwares',
    name: 'Computadores Desktop, Tablets de Campo para OS e Impressoras',
    estimatedCost: 9000,
    actualCost: 8650,
    status: 'adquirido',
    date: '2024-02-05'
  },
  {
    id: 'sc-7',
    category: 'Legalização & Abertura',
    name: 'Registro Contábil, Alvarás, Bombeiros e Licenças Ambientais',
    estimatedCost: 3200,
    actualCost: 3100,
    status: 'adquirido',
    date: '2024-01-05'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-30 14:22:10',
    userName: 'Carlos Silva',
    userRole: 'tecnico',
    action: 'Assinatura Digital Coletada',
    details: 'Coleta de assinatura digital do cliente Antônio Prado na OS-2026-102.'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-28 11:15:00',
    userName: 'Administrador Geral',
    userRole: 'admin',
    action: 'Importação XML de NF-e',
    details: 'NF-e 18924 importada. 5 unidades do produto BOIL-600-AP inseridas no estoque.'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-25 09:30:45',
    userName: 'Condomínio Bella Vista',
    userRole: 'cliente',
    action: 'Abertura de Chamado em Garantia',
    details: 'Chamado #TKT-1 aberto via Portal do Cliente vinculado à OS-2026-102.'
  }
];

export const initialSequenceSettings: SequenceSettings = {
  serviceOrderNextNumber: 2025020328,
  serviceOrderPrefix: '',
  serviceOrderDigits: 0,
  saleNextNumber: 1001,
  salePrefix: 'VD-',
  budgetNextNumber: 501,
  budgetPrefix: 'ORC-'
};

export const initialWarrantyPolicies: WarrantyPolicy[] = [
  {
    id: 'wp-1',
    name: 'Garantia Padrão Legal de Mão de Obra (90 Dias)',
    days: 90,
    category: 'Manutenção Preventiva & Geral',
    isDefault: true,
    terms: 'Garantia legal de 90 (noventa) dias para serviços e mão de obra técnica em conformidade com o Artigo 26, inciso II, do CDC. Cobre defeitos de montagem, ajustes e estanqueidade nas conexões efetuadas pela equipe técnica.',
    linkedServiceIds: ['srv-1', 'srv-3', 'srv-6'],
    createdAt: '2024-01-15'
  },
  {
    id: 'wp-2',
    name: 'Garantia Especial de Troca de Componentes Elétricos (180 Dias)',
    days: 180,
    category: 'Elétrica & Aquecimento',
    isDefault: false,
    terms: 'Garantia de 180 (cento e oitenta) dias para substituição de resistências elétricas, termostatos e comandos de automação. Excluem-se queimas causadas por descargas atmosféricas ou acionamento a seco sem fluxo de água.',
    linkedServiceIds: ['srv-2', 'srv-5'],
    createdAt: '2024-02-10'
  },
  {
    id: 'wp-3',
    name: 'Garantia Integral de Caldeiraria e Solda em Inox (365 Dias)',
    days: 365,
    category: 'Caldeiraria & Solda Especializada',
    isDefault: false,
    terms: 'Garantia de 1 (um) ano sobre serviços de solda TIG em aço inox 316L e reparação de fissuras em reservatórios térmicos e caldeiras pressurizadas.',
    linkedServiceIds: ['srv-4'],
    createdAt: '2024-03-01'
  }
];

export const initialCompanySettings: CompanySettings = {
  companyName: 'MP PISCINA Aquecimento & Filtros',
  tradeName: 'MP PISCINA Assistência Técnica Especializada',
  cnpj: '12.345.678/0001-90',
  ie: '123.456.789.110',
  im: '987.654/001',
  phone: '(61) 99860-1113',
  email: 'mppiscina2004@gmail.com',
  cep: '72300-500',
  street: 'Quadra QR 114 Conjunto 6',
  number: '201',
  neighborhood: 'Samambaia Sul (Samambaia)',
  city: 'Brasília',
  state: 'DF',
  taxRegime: 'simples_nacional',
  defaultWarrantyTerms: 'Garantia legal de 90 dias para mão de obra conforme Código de Defesa do Consumidor (Art. 26, II). Reservatórios térmicos e equipamentos possuem garantia do fabricante de 12 a 36 meses contra defeitos de fabricação, desde que observadas as instalações hidráulicas conforme NBR 15569 e vistorias anuais.',
  fiscalEnvironment: 'homologacao',
  standardVisitFee: 150.00,
  sequenceSettings: initialSequenceSettings
};

export const initialServiceCatalog: ServiceCatalogItem[] = [
  {
    id: 'srv-1',
    code: 'SRV-01',
    name: 'Revisão Preventiva Geral e Limpeza de Boiler / Reservatório',
    category: 'Manutenção Preventiva',
    defaultHours: 2.5,
    standardPrice: 380.00,
    minPrice: 300.00
  },
  {
    id: 'srv-2',
    code: 'SRV-02',
    name: 'Substituição de Resistência Elétrica Blindada e Termostato Duplo',
    category: 'Elétrica & Aquecimento',
    defaultHours: 1.5,
    standardPrice: 220.00,
    minPrice: 180.00
  },
  {
    id: 'srv-3',
    code: 'SRV-03',
    name: 'Troca de Ânodo de Sacrifício de Magnésio (Anti-Corrosão)',
    category: 'Proteção Catódica',
    defaultHours: 1.0,
    standardPrice: 160.00,
    minPrice: 120.00
  },
  {
    id: 'srv-4',
    code: 'SRV-04',
    name: 'Solda TIG em Aço Inox 316L e Reparo de Ponto de Fuga',
    category: 'Caldeiraria & Solda',
    defaultHours: 3.5,
    standardPrice: 650.00,
    minPrice: 500.00
  },
  {
    id: 'srv-5',
    code: 'SRV-05',
    name: 'Alinhamento a Laser, Balanceamento e Troca de Selo Mecânico de Bomba',
    category: 'Pressurização',
    defaultHours: 2.0,
    standardPrice: 420.00,
    minPrice: 350.00
  },
  {
    id: 'srv-6',
    code: 'SRV-06',
    name: 'Taxa de Diagnóstico Técnico e Visita de Emergência',
    category: 'Atendimento em Campo',
    defaultHours: 1.0,
    standardPrice: 150.00,
    minPrice: 120.00
  }
];

export const initialChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'chk-tmpl-1',
    title: 'Checklist Padrão: Reservatório Térmico (Boiler Solar/Elétrico)',
    equipmentType: 'Reservatório Térmico',
    items: [
      { id: 'it-1', label: 'Vistoria visual do casco externo e isolamento em poliuretano', category: 'Estrutura e Tanque', required: true },
      { id: 'it-2', label: 'Inspeção de corrosão ou vazamentos nas soldas dos flanges', category: 'Estrutura e Tanque', required: true },
      { id: 'it-3', label: 'Medição de resistência ôhmica do elemento de aquecimento', category: 'Elétrica e Comando', required: true },
      { id: 'it-4', label: 'Verificação do nível de desgaste do ânodo de magnésio', category: 'Acessórios e Segurança', required: true },
      { id: 'it-5', label: 'Teste de estanqueidade pressurizado a 4.0 kgf/cm²', category: 'Hidráulica e Pressão', required: true },
      { id: 'it-6', label: 'Aferição do termostato de segurança e rearme manual', category: 'Elétrica e Comando', required: true }
    ]
  },
  {
    id: 'chk-tmpl-2',
    title: 'Checklist Padrão: Bomba de Circulação e Pressurizador',
    equipmentType: 'Pressurizador / Motobomba',
    items: [
      { id: 'it-b1', label: 'Verificação de ruídos mecânicos e vibração excessiva no motor', category: 'Estrutura e Tanque', required: true },
      { id: 'it-b2', label: 'Checagem do pressostato e vaso de expansão pré-calibrado', category: 'Hidráulica e Pressão', required: true },
      { id: 'it-b3', label: 'Substituição de selo mecânico e o-rings de vedação', category: 'Hidráulica e Pressão', required: false },
      { id: 'it-b4', label: 'Aferição da corrente elétrica (Amperes) nominal do motor', category: 'Elétrica e Comando', required: true },
      { id: 'it-b5', label: 'Teste funcional de liga/desliga com abertura de pontos de consumo', category: 'Acessórios e Segurança', required: true }
    ]
  }
];

