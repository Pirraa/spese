# Backend Gestione Spese

Backend API per l'applicazione di gestione spese personali, costruito con Express.js, TypeScript, PostgreSQL e Prisma.

## 🚀 Tecnologie Utilizzate

- **Express.js** - Framework web per Node.js
- **TypeScript** - Superset tipizzato di JavaScript
- **PostgreSQL** - Database relazionale
- **Prisma** - ORM e query builder
- **Zod** - Validazione schema TypeScript-first
- **JWT** - Autenticazione tramite JSON Web Tokens

## 📁 Struttura del Progetto

```
backend/
├── src/
│   ├── controllers/          # Logica di business
│   ├── routes/              # Definizione delle route API
│   ├── middleware/          # Middleware personalizzati
│   ├── services/            # Servizi e logica di business
│   ├── types/              # Definizioni di tipi TypeScript
│   ├── utils/              # Utilità e helper
│   └── index.ts            # Entry point dell'applicazione
├── prisma/
│   ├── schema.prisma       # Schema del database
│   └── seed.ts            # Script per popolare il database
├── tests/                  # Test unitari e di integrazione
├── package.json
├── tsconfig.json
└── .env.example
```

## 🛠️ Installazione e Configurazione

1. **Installa le dipendenze:**

   ```bash
   cd backend
   npm install
   ```

2. **Configura le variabili d'ambiente:**

   ```bash
   cp .env.example .env
   ```

   Modifica il file `.env` con i tuoi valori:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/spese_db?schema=public"
   JWT_SECRET="your_super_secret_jwt_key_here"
   PORT=3001
   ```

3. **Configurazione del Database:**

   ```bash
   # Genera il client Prisma
   npm run prisma:generate

   # Esegui le migrazioni
   npm run prisma:migrate

   # Popola il database con dati di esempio
   npm run prisma:seed
   ```

4. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

## 📊 Schema del Database

### Entità Principali

- **Utente**: Informazioni dell'utente
- **Fonte**: Carte, contanti, conti digitali
- **Transazione**: Entrate, spese, trasferimenti
- **Categoria**: Categorizzazione delle transazioni

### Relazioni

- Un Utente può avere molte Fonti
- Un Utente può avere molte Transazioni
- Una Transazione appartiene a una Fonte (e opzionalmente a una Fonte destinazione per i trasferimenti)

## 🌐 API Endpoints

### Fonti di Denaro

- `GET /api/fonti` - Lista tutte le fonti
- `GET /api/fonti/:id` - Dettagli di una fonte specifica
- `POST /api/fonti` - Crea una nuova fonte
- `PUT /api/fonti/:id` - Aggiorna una fonte
- `DELETE /api/fonti/:id` - Elimina una fonte (soft delete)

### Transazioni

- `GET /api/transazioni` - Lista tutte le transazioni (con paginazione)
- `GET /api/transazioni/:id` - Dettagli di una transazione
- `POST /api/transazioni` - Crea una nuova transazione
- `PUT /api/transazioni/:id` - Aggiorna una transazione
- `DELETE /api/transazioni/:id` - Elimina una transazione
- `GET /api/transazioni/statistiche/riepilogo` - Statistiche e riepilogo

### Autenticazione

- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente

## 🧪 Testing

```bash
# Esegui tutti i test
npm test

# Esegui i test in modalità watch
npm run test:watch
```

## 🚀 Deployment

1. **Build del progetto:**

   ```bash
   npm run build
   ```

2. **Avvia in produzione:**
   ```bash
   npm start
   ```

## 📝 Scripts Disponibili

- `npm run dev` - Avvia il server di sviluppo con hot reload
- `npm run build` - Compila TypeScript in JavaScript
- `npm start` - Avvia il server in produzione
- `npm run prisma:generate` - Genera il client Prisma
- `npm run prisma:migrate` - Esegue le migrazioni del database
- `npm run prisma:studio` - Apre Prisma Studio (interfaccia grafica per il database)
- `npm run prisma:seed` - Popola il database con dati di esempio
- `npm test` - Esegue i test
- `npm run lint` - Controlla il codice con ESLint

## 🔒 Sicurezza

- Rate limiting per prevenire attacchi DDoS
- Helmet.js per headers di sicurezza
- Validazione input con Zod
- Autenticazione JWT
- Hashing delle password con bcrypt

## 📈 Monitoraggio

- Health check endpoint: `GET /health`
- Logging strutturato
- Error handling centralizzato

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.
