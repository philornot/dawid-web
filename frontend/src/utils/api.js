const API_ENDPOINTS = [
  "http://100.113.203.25:5000", // Twój główny adres
  "http://localhost:5000",       // Fallback lokalny
  "http://192.168.1.144:5000",   // Fallback sieciowy
];

class ApiService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || API_ENDPOINTS[0];
    this.timeout = 10000; // 10 sekund timeout
  }

  async findWorkingEndpoint() {
    for (const endpoint of API_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${endpoint}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.baseUrl = endpoint;
          console.log(`✅ Połączono z serwerem: ${endpoint}`);
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Nie można połączyć z: ${endpoint}`, error.message);
        continue;
      }
    }
    throw new Error('Nie można połączyć się z żadnym serwerem');
  }

  async sendMessage(message, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Jeśli to pierwsza próba lub poprzednia się nie udała, sprawdź endpoint
        if (attempt === 1 || attempt > 1) {
          try {
            await this.findWorkingEndpoint();
          } catch (e) {
            if (attempt === retries) throw e;
            continue;
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        console.error(`Próba ${attempt}/${retries} nie powiodła się:`, error);
        
        if (attempt === retries) {
          // Ostatnia próba - zwróć szczegółowy błąd
          throw new Error(this.getDetailedError(error));
        }
        
        // Czekaj przed kolejną próbą (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  getDetailedError(error) {
    if (error.name === 'AbortError') {
      return 'Przekroczono limit czasu oczekiwania (10s). Sprawdź połączenie internetowe.';
    }
    
    if (error.message.includes('Failed to fetch')) {
      return `Nie można połączyć się z serwerem. Sprawdź czy:
• Serwer jest uruchomiony
• Adres ${this.baseUrl} jest dostępny
• Firewall nie blokuje połączenia
• Masz połączenie z internetem`;
    }
    
    if (error.message.includes('HTTP')) {
      return `Serwer odpowiedział błędem: ${error.message}`;
    }
    
    return `Nieoczekiwany błąd: ${error.message}`;
  }
}

export const apiService = new ApiService();