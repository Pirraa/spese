import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inizio seeding del database...');

  // Crea un utente di esempio
  const utente = await prisma.utente.upsert({
    where: { email: 'demo@esempio.com' },
    update: {},
    create: {
      email: 'demo@esempio.com',
      nome: 'Mario',
      cognome: 'Rossi',
      password: 'password123' // In produzione, questo dovrebbe essere hashato
    }
  });

  console.log('👤 Utente creato:', utente.email);

  // Crea le fonti di esempio
  const fonti = await Promise.all([
    prisma.fonte.upsert({
      where: { id: 'fonte1' },
      update: {},
      create: {
        id: 'fonte1',
        nome: 'PostePay',
        tipo: 'CARTA',
        saldo: 250.50,
        codice: '****1234',
        utenteId: utente.id
      }
    }),
    prisma.fonte.upsert({
      where: { id: 'fonte2' },
      update: {},
      create: {
        id: 'fonte2',
        nome: 'Hype',
        tipo: 'DIGITALE',
        saldo: 120.00,
        utenteId: utente.id
      }
    }),
    prisma.fonte.upsert({
      where: { id: 'fonte3' },
      update: {},
      create: {
        id: 'fonte3',
        nome: 'Portafoglio',
        tipo: 'CONTANTI',
        saldo: 45.20,
        ubicazione: 'Tasca destra',
        utenteId: utente.id
      }
    }),
    prisma.fonte.upsert({
      where: { id: 'fonte4' },
      update: {},
      create: {
        id: 'fonte4',
        nome: 'Salvadanaio',
        tipo: 'CONTANTI',
        saldo: 85.75,
        ubicazione: 'Camera da letto',
        utenteId: utente.id
      }
    })
  ]);

  console.log('💳 Fonti create:', fonti.length);

  // Crea transazioni di esempio
  const transazioni = await Promise.all([
    prisma.transazione.create({
      data: {
        tipo: 'SPESA',
        importo: 12.50,
        descrizione: 'Pranzo al bar',
        luogo: 'Bar Centrale',
        fonteId: 'fonte3',
        utenteId: utente.id,
        data: new Date('2024-01-15')
      }
    }),
    prisma.transazione.create({
      data: {
        tipo: 'ENTRATA',
        importo: 50.00,
        descrizione: 'Prelievo per spese',
        fonteId: 'fonte3',
        utenteId: utente.id,
        data: new Date('2024-01-14')
      }
    }),
    prisma.transazione.create({
      data: {
        tipo: 'TRASFERIMENTO',
        importo: 50.00,
        descrizione: 'Prelievo ATM',
        fonteId: 'fonte1',
        fonteDestinazioneId: 'fonte3',
        utenteId: utente.id,
        data: new Date('2024-01-14')
      }
    })
  ]);

  console.log('💸 Transazioni create:', transazioni.length);

  // Crea categorie di esempio
  const categorie = await Promise.all([
    prisma.categoria.create({
      data: {
        nome: 'Alimentari',
        tipo: 'SPESA',
        colore: '#ff6b6b',
        icona: '🛒'
      }
    }),
    prisma.categoria.create({
      data: {
        nome: 'Trasporti',
        tipo: 'SPESA',
        colore: '#4ecdc4',
        icona: '🚗'
      }
    }),
    prisma.categoria.create({
      data: {
        nome: 'Stipendio',
        tipo: 'ENTRATA',
        colore: '#45b7d1',
        icona: '💰'
      }
    }),
    prisma.categoria.create({
      data: {
        nome: 'Freelance',
        tipo: 'ENTRATA',
        colore: '#96ceb4',
        icona: '💻'
      }
    })
  ]);

  console.log('📂 Categorie create:', categorie.length);
  console.log('✅ Seeding completato con successo!');
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
