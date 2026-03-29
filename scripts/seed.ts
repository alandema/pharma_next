import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

type SeedPrescriber = {
  password: string;
  role: 'admin' | 'user' | 'superadmin';
  email: string;
  send_email: boolean;
  is_active: boolean;
  full_name: string;
  cpf: string;
  gender: string;
  birth_date: Date;
  phone: string;
  council: string;
  council_number: string;
  council_state: string;
  zipcode: string;
  street: string;
  address_number: string;
  complement?: string;
  city: string;
  state: string;
};

type SeedPatient = {
  key: string;
  doctorEmail: string;
  name: string;
  email?: string;
  send_email: boolean;
  rg?: string;
  gender?: string;
  cpf?: string;
  birth_date?: Date;
  phone?: string;
  zipcode?: string;
  street?: string;
  district?: string;
  house_number?: string;
  additional_info?: string;
  city?: string;
  state?: string;
  country?: string;
  medical_history?: string;
};

type SeedPrescription = {
  patientKey: string;
  date_prescribed: Date;
  cid_code: string;
  formulas: { formulaRef: string; description: string }[];
};

async function main() {
  console.log('Starting database seed...');

  // Create prescriber accounts (with complete profile fields expected by the current schema)
  const prescribers: SeedPrescriber[] = [
    {
      password: 'admin123',
      role: 'admin',
      email: 'admin@pharmanext.test',
      send_email: true,
      is_active: true,
      full_name: 'Administrador PharmaNext',
      cpf: '101.202.303-40',
      gender: 'Masculino',
      birth_date: new Date('1980-01-10T00:00:00.000Z'),
      phone: '(11) 90000-0001',
      council: 'N/A',
      council_number: 'N/A',
      council_state: 'SP',
      zipcode: '01310-100',
      street: 'Av. Paulista',
      address_number: '1000',
      complement: 'Sala 101',
      city: 'São Paulo',
      state: 'SP',
    },
    {
      password: 'doctor123',
      role: 'user',
      email: 'doctor1@pharmanext.test',
      send_email: true,
      is_active: true,
      full_name: 'Dra. Mariana Costa',
      cpf: '111.222.333-44',
      gender: 'Feminino',
      birth_date: new Date('1987-03-20T00:00:00.000Z'),
      phone: '(11) 90000-0002',
      council: 'CRM',
      council_number: '154321',
      council_state: 'SP',
      zipcode: '01415-000',
      street: 'Rua Oscar Freire',
      address_number: '450',
      complement: 'Conjunto 22',
      city: 'São Paulo',
      state: 'SP',
    },
    {
      password: 'doctor123',
      role: 'user',
      email: 'doctor2@pharmanext.test',
      send_email: false,
      is_active: true,
      full_name: 'Dr. Rafael Nogueira',
      cpf: '555.666.777-88',
      gender: 'Masculino',
      birth_date: new Date('1983-11-08T00:00:00.000Z'),
      phone: '(11) 90000-0003',
      council: 'CRM',
      council_number: '198765',
      council_state: 'SP',
      zipcode: '04538-133',
      street: 'Av. Brigadeiro Faria Lima',
      address_number: '3900',
      complement: 'Andar 8',
      city: 'São Paulo',
      state: 'SP',
    },
  ];

  const prescriberByEmail = new Map<string, { id: string; email: string; role: string }>();
  for (const prescriber of prescribers) {
    const passwordHash = await bcrypt.hash(prescriber.password, 10);

    const createdOrUpdated = await prisma.user.upsert({
      where: { email: prescriber.email },
      update: {
        email: prescriber.email,
        send_email: prescriber.send_email,
        password_hash: passwordHash,
        role: prescriber.role,
        is_active: prescriber.is_active,
        full_name: prescriber.full_name,
        cpf: prescriber.cpf,
        gender: prescriber.gender,
        birth_date: prescriber.birth_date,
        phone: prescriber.phone,
        council: prescriber.council,
        council_number: prescriber.council_number,
        council_state: prescriber.council_state,
        zipcode: prescriber.zipcode,
        street: prescriber.street,
        address_number: prescriber.address_number,
        complement: prescriber.complement,
        city: prescriber.city,
        state: prescriber.state,
      },
      create: {
        email: prescriber.email,
        send_email: prescriber.send_email,
        password_hash: passwordHash,
        role: prescriber.role,
        is_active: prescriber.is_active,
        full_name: prescriber.full_name,
        cpf: prescriber.cpf,
        gender: prescriber.gender,
        birth_date: prescriber.birth_date,
        phone: prescriber.phone,
        council: prescriber.council,
        council_number: prescriber.council_number,
        council_state: prescriber.council_state,
        zipcode: prescriber.zipcode,
        street: prescriber.street,
        address_number: prescriber.address_number,
        complement: prescriber.complement,
        city: prescriber.city,
        state: prescriber.state,
      },
      select: { id: true, email: true, role: true },
    });

    prescriberByEmail.set(createdOrUpdated.email, createdOrUpdated);
    console.log(`✓ Upserted prescriber ${createdOrUpdated.email}`);
  }

  // Create formulas used by the prescription flow
  const formulaSeeds = [
    { name: 'Aspirin Complex', information: 'Analgésico e antitérmico. Uso oral após refeições.' },
    { name: 'Losartan 50mg', information: '1 comprimido pela manhã. Monitorar pressão arterial.' },
    { name: 'Metformin 850mg', information: '1 comprimido após café da manhã e jantar.' },
    { name: 'Vitamina D3', information: '2000 UI ao dia por 90 dias.' },
    { name: 'Ibuprofeno 400mg', information: '1 comprimido a cada 8 horas se dor.' },
  ];

  const formulaByName = new Map<string, { id: string; name: string; information: string | null }>();
  for (const formula of formulaSeeds) {
    const saved = await prisma.formulas.upsert({
      where: { name: formula.name },
      update: { information: formula.information },
      create: formula,
      select: { id: true, name: true, information: true },
    });

    formulaByName.set(saved.name, saved);
  }
  console.log('✓ Upserted formulas');

  const doctor1 = prescriberByEmail.get('doctor1@pharmanext.test');
  const doctor2 = prescriberByEmail.get('doctor2@pharmanext.test');
  if (!doctor1 || !doctor2) {
    throw new Error('Seed prescribers were not created correctly.');
  }

  // Create patients associated with a single doctor (registered_by)
  const patients: SeedPatient[] = [
    {
      key: 'alice',
      doctorEmail: 'doctor1@pharmanext.test',
      name: 'Alice Johnson',
      email: 'alice@pharmanext.test',
      send_email: true,
      rg: '33.456.789-1',
      cpf: '123.456.789-01',
      gender: 'Feminino',
      birth_date: new Date('1985-03-15T00:00:00.000Z'),
      phone: '(11) 98765-4321',
      zipcode: '01310-100',
      street: 'Av. Paulista',
      district: 'Bela Vista',
      house_number: '1578',
      additional_info: 'Apartamento 82',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      medical_history: 'Sem histórico médico relevante.',
    },
    {
      key: 'bob',
      doctorEmail: 'doctor1@pharmanext.test',
      name: 'Bob Smith',
      email: 'bob@pharmanext.test',
      send_email: false,
      rg: '44.567.890-2',
      cpf: '234.567.890-12',
      gender: 'Masculino',
      birth_date: new Date('1978-07-22T00:00:00.000Z'),
      phone: '(11) 98765-1234',
      zipcode: '04543-907',
      street: 'Av. Brigadeiro Faria Lima',
      district: 'Itaim Bibi',
      house_number: '3477',
      additional_info: 'Conjunto 1203',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      medical_history: 'Hipertensão arterial sistêmica.',
    },
    {
      key: 'carol',
      doctorEmail: 'doctor1@pharmanext.test',
      name: 'Carol Martinez',
      email: 'carol@pharmanext.test',
      send_email: true,
      rg: '55.678.901-3',
      cpf: '345.678.901-23',
      gender: 'Feminino',
      birth_date: new Date('1992-11-03T00:00:00.000Z'),
      phone: '(11) 98765-5678',
      zipcode: '05508-000',
      street: 'Av. Rebouças',
      district: 'Pinheiros',
      house_number: '3970',
      additional_info: 'Próximo ao metrô',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      medical_history: 'Alergia conhecida a penicilina.',
    },
    {
      key: 'david',
      doctorEmail: 'doctor2@pharmanext.test',
      name: 'David Lee',
      email: 'david@pharmanext.test',
      send_email: true,
      rg: '66.789.012-4',
      cpf: '456.789.012-34',
      gender: 'Masculino',
      birth_date: new Date('1965-05-18T00:00:00.000Z'),
      phone: '(11) 98765-9012',
      zipcode: '01452-002',
      street: 'Rua Augusta',
      district: 'Consolação',
      house_number: '2690',
      additional_info: 'Fundos',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      medical_history: 'Diabetes mellitus tipo 2.',
    },
    {
      key: 'emma',
      doctorEmail: 'doctor2@pharmanext.test',
      name: 'Emma Wilson',
      email: 'emma@pharmanext.test',
      send_email: false,
      rg: '77.890.123-5',
      cpf: '567.890.123-45',
      gender: 'Feminino',
      birth_date: new Date('2000-09-25T00:00:00.000Z'),
      phone: '(11) 98765-3456',
      zipcode: '01414-001',
      street: 'Rua Haddock Lobo',
      district: 'Cerqueira César',
      house_number: '595',
      additional_info: 'Apto 42',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      medical_history: 'Deficiência de vitamina D.',
    },
  ];

  const patientByKey = new Map<string, { id: string; name: string; registered_by: string }>();
  for (const patient of patients) {
    const doctor = prescriberByEmail.get(patient.doctorEmail);
    if (!doctor || doctor.role !== 'user') {
      throw new Error(`Prescriber ${patient.doctorEmail} not found or invalid role.`);
    }

    const saved = await prisma.patient.upsert({
      where: { cpf: patient.cpf },
      update: {
        registered_by: doctor.id,
        name: patient.name,
        email: patient.email,
        send_email: patient.send_email,
        rg: patient.rg,
        gender: patient.gender,
        cpf: patient.cpf,
        birth_date: patient.birth_date,
        phone: patient.phone,
        zipcode: patient.zipcode,
        street: patient.street,
        district: patient.district,
        house_number: patient.house_number,
        additional_info: patient.additional_info,
        city: patient.city,
        state: patient.state,
        country: patient.country,
        medical_history: patient.medical_history,
      },
      create: {
        registered_by: doctor.id,
        name: patient.name,
        email: patient.email,
        send_email: patient.send_email,
        rg: patient.rg,
        gender: patient.gender,
        cpf: patient.cpf,
        birth_date: patient.birth_date,
        phone: patient.phone,
        zipcode: patient.zipcode,
        street: patient.street,
        district: patient.district,
        house_number: patient.house_number,
        additional_info: patient.additional_info,
        city: patient.city,
        state: patient.state,
        country: patient.country,
        medical_history: patient.medical_history,
      },
      select: { id: true, name: true, registered_by: true },
    });

    patientByKey.set(patient.key, saved);
  }
  console.log('✓ Upserted patients');

  const prescriptions: SeedPrescription[] = [
    {
      patientKey: 'alice',
      date_prescribed: new Date('2026-02-10T00:00:00.000Z'),
      cid_code: 'R51',
      formulas: [
        { formulaRef: 'Aspirin Complex', description: 'Tomar 1 comprimido a cada 8 horas por 7 dias, após refeições.' },
      ],
    },
    {
      patientKey: 'bob',
      date_prescribed: new Date('2026-02-12T00:00:00.000Z'),
      cid_code: 'I10',
      formulas: [
        { formulaRef: 'Losartan 50mg', description: 'Tomar 1 comprimido pela manhã continuamente.' },
      ],
    },
    {
      patientKey: 'carol',
      date_prescribed: new Date('2026-02-13T00:00:00.000Z'),
      cid_code: 'J01',
      formulas: [
        { formulaRef: 'free', description: 'Cefalexina 500mg: tomar 1 cápsula a cada 12 horas por 10 dias.' },
      ],
    },
    {
      patientKey: 'david',
      date_prescribed: new Date('2026-02-14T00:00:00.000Z'),
      cid_code: 'E11',
      formulas: [
        { formulaRef: 'Metformin 850mg', description: 'Tomar 1 comprimido após café e jantar, uso contínuo.' },
      ],
    },
    {
      patientKey: 'emma',
      date_prescribed: new Date('2026-02-15T00:00:00.000Z'),
      cid_code: 'E55',
      formulas: [
        { formulaRef: 'Vitamina D3', description: 'Tomar 2000 UI por dia durante 90 dias.' },
      ],
    },
    {
      patientKey: 'alice',
      date_prescribed: new Date('2026-03-01T00:00:00.000Z'),
      cid_code: 'M79',
      formulas: [
        { formulaRef: 'Ibuprofeno 400mg', description: 'Se dor muscular, tomar 1 comprimido a cada 8 horas por até 5 dias.' },
      ],
    },
  ];

  const seededPatientIds = Array.from(patientByKey.values()).map((p) => p.id);
  await prisma.prescription.deleteMany({
    where: { patient_id: { in: seededPatientIds } },
  });

  const createdPrescriptionPairs: Array<{ user_id: string; patient_id: string }> = [];
  for (const item of prescriptions) {
    const patient = patientByKey.get(item.patientKey);
    if (!patient) {
      throw new Error(`Patient with key ${item.patientKey} not found in seed map.`);
    }

    const formInfo = {
      cid_code: item.cid_code,
      formulas: item.formulas.map((formula) => {
        if (formula.formulaRef === 'free') {
          return {
            formula_id: 'free',
            formula_name: '',
            description: formula.description,
          };
        }

        const dbFormula = formulaByName.get(formula.formulaRef);
        if (!dbFormula) {
          throw new Error(`Formula ${formula.formulaRef} not found for prescription seeding.`);
        }

        return {
          formula_id: dbFormula.id,
          formula_name: dbFormula.name,
          description: formula.description,
        };
      }),
    };

    // Business rule: the prescribing prescriber must match the patient's current owner.
    const prescription = await prisma.prescription.create({
      data: {
        patient_id: patient.id,
        prescribed_by: patient.registered_by,
        date_prescribed: item.date_prescribed,
        json_form_info: formInfo,
      },
      select: { id: true, prescribed_by: true, patient_id: true },
    });

    if (prescription.prescribed_by) {
      createdPrescriptionPairs.push({
        user_id: prescription.prescribed_by,
        patient_id: prescription.patient_id,
      });
    }
  }
  console.log('✓ Recreated prescriptions with ownership consistency');

  await prisma.log.deleteMany({
    where: { patient_id: { in: seededPatientIds } },
  });

  const registerEvents = patients.map((patient, index) => {
    const mappedPatient = patientByKey.get(patient.key);
    const doctor = prescriberByEmail.get(patient.doctorEmail);
    if (!mappedPatient || !doctor) {
      throw new Error(`Failed to map patient ${patient.key} for log seed.`);
    }

    return {
      event_time: new Date(Date.UTC(2026, 0, 10 + index, 9, 0, 0)),
      message: `Cadastrou paciente: ${mappedPatient.name}`,
      user_id: doctor.id,
      patient_id: mappedPatient.id,
    };
  });

  const prescriptionEvents = createdPrescriptionPairs.map((pair, index) => ({
    event_time: new Date(Date.UTC(2026, 1, 10 + index, 11, 0, 0)),
    message: `Prescritor ${pair.user_id} fez uma prescrição para paciente ${pair.patient_id}`,
    user_id: pair.user_id,
    patient_id: pair.patient_id,
  }));

  await prisma.log.createMany({
    data: [...registerEvents, ...prescriptionEvents],
  });
  console.log('✓ Recreated logs');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Admin: email=admin@pharmanext.test, password=admin123');
  console.log('  Prescriber: email=doctor1@pharmanext.test, password=doctor123');
  console.log('  Prescriber: email=doctor2@pharmanext.test, password=doctor123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error seeding database:', e);
  process.exit(1);
});
