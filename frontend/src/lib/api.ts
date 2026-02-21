const API_BASE_URL = 'http://localhost:3001/api';

// Funzione helper per le chiamate autenticate
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se il token è scaduto, reindirizza al login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sessione scaduta');
  }

  return response;
};

// Tipi per l'API
export interface ApiFonte {
  id: string;
  nome: string;
  tipo: 'CARTA' | 'DIGITALE' | 'CONTANTI';
  saldo: number;
  codice?: string;
  ubicazione?: string;
  utenteId: string;
  createdAt: string;
  updatedAt: string;
  attiva: boolean;
}

export interface ApiTransazione {
  id: string;
  tipo: 'ENTRATA' | 'SPESA' | 'TRASFERIMENTO';
  importo: number;
  descrizione: string;
  luogo?: string;
  fonteId: string;
  fonteDestinazioneId?: string;
  utenteId: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  fonte: ApiFonte;
  fonteDestinazione?: ApiFonte;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Funzioni per le Fonti
export const fontiApi = {
  // Ottieni tutte le fonti
  getAll: async (): Promise<ApiFonte[]> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/fonti`);
    if (!response.ok) {
      throw new Error('Errore nel recupero delle fonti');
    }
    const result: ApiResponse<ApiFonte[]> = await response.json();
    return result.data;
  },

  // Ottieni una fonte specifica
  getById: async (id: string): Promise<ApiFonte> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/fonti/${id}`);
    if (!response.ok) {
      throw new Error('Errore nel recupero della fonte');
    }
    const result: ApiResponse<ApiFonte> = await response.json();
    return result.data;
  },

  // Crea una nuova fonte
  create: async (fonte: Omit<ApiFonte, 'id' | 'utenteId' | 'createdAt' | 'updatedAt' | 'attiva'>): Promise<ApiFonte> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/fonti`, {
      method: 'POST',
      body: JSON.stringify(fonte),
    });
    if (!response.ok) {
      throw new Error('Errore nella creazione della fonte');
    }
    const result: ApiResponse<ApiFonte> = await response.json();
    return result.data;
  },

  // Aggiorna una fonte
  update: async (id: string, fonte: Partial<Omit<ApiFonte, 'id' | 'utenteId' | 'createdAt' | 'updatedAt'>>): Promise<ApiFonte> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/fonti/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fonte),
    });
    if (!response.ok) {
      throw new Error('Errore nell\'aggiornamento della fonte');
    }
    const result: ApiResponse<ApiFonte> = await response.json();
    return result.data;
  },

  // Elimina una fonte
  delete: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/fonti/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Errore nell\'eliminazione della fonte');
    }
  },
};

// Funzioni per le Transazioni
export const transazioniApi = {
  // Ottieni tutte le transazioni
  getAll: async (params?: { limit?: number; offset?: number; tipo?: string }): Promise<{ transazioni: ApiTransazione[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());
    if (params?.tipo) searchParams.append('tipo', params.tipo);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/transazioni?${queryString}`
      : `${API_BASE_URL}/transazioni`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
      throw new Error('Errore nel recupero delle transazioni');
    }
    const result: ApiListResponse<ApiTransazione> = await response.json();
    return {
      transazioni: result.data,
      total: result.pagination?.total || 0
    };
  },

  // Ottieni una transazione specifica
  getById: async (id: string): Promise<ApiTransazione> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/transazioni/${id}`);
    if (!response.ok) {
      throw new Error('Errore nel recupero della transazione');
    }
    const result: ApiResponse<ApiTransazione> = await response.json();
    return result.data;
  },

  // Crea una nuova transazione
  create: async (transazione: {
    tipo: 'ENTRATA' | 'SPESA' | 'TRASFERIMENTO';
    importo: number;
    descrizione: string;
    luogo?: string;
    fonteId: string;
    fonteDestinazioneId?: string;
    data?: string;
  }): Promise<ApiTransazione> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/transazioni`, {
      method: 'POST',
      body: JSON.stringify(transazione),
    });
    if (!response.ok) {
      throw new Error('Errore nella creazione della transazione');
    }
    const result: ApiResponse<ApiTransazione> = await response.json();
    return result.data;
  },

  // Ottieni statistiche
  getStatistiche: async (params?: { mese?: number; anno?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.mese) searchParams.append('mese', params.mese.toString());
    if (params?.anno) searchParams.append('anno', params.anno.toString());

    const response = await authenticatedFetch(`${API_BASE_URL}/transazioni/statistiche/riepilogo?${searchParams}`);
    if (!response.ok) {
      throw new Error('Errore nel recupero delle statistiche');
    }
    const result = await response.json();
    return result.data;
  },

  // Ottieni gli anni disponibili per le statistiche
  getAnniDisponibili: async (): Promise<number[]> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/transazioni/statistiche/anni`);
    if (!response.ok) {
      throw new Error('Errore nel recupero degli anni disponibili');
    }
    const result = await response.json();
    return result.data?.years || [];
  },
};

// Funzioni di utilità per convertire i tipi
export const convertiTipoFonte = (tipo: 'CARTA' | 'DIGITALE' | 'CONTANTI'): 'carta' | 'digitale' | 'contanti' => {
  switch (tipo) {
    case 'CARTA': return 'carta';
    case 'DIGITALE': return 'digitale';
    case 'CONTANTI': return 'contanti';
    default: return 'carta';
  }
};

export const convertiTipoTransazione = (tipo: 'ENTRATA' | 'SPESA' | 'TRASFERIMENTO'): 'entrata' | 'spesa' | 'trasferimento' => {
  switch (tipo) {
    case 'ENTRATA': return 'entrata';
    case 'SPESA': return 'spesa';
    case 'TRASFERIMENTO': return 'trasferimento';
    default: return 'spesa';
  }
};
