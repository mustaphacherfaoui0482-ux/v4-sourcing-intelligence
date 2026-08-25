import { fetchAlibabaThroughPiloterr, piloterrConfigured } from './alibaba-piloterr.js';
import { fetchAlibabaThroughReader } from './alibaba-reader-fallback.js';
import { parseAlibabaProductHtml } from '../modules/alibaba-parser.js';
import { parseAlibabaReaderText } from '../modules/alibaba-reader-parser.js';

function isPresent(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function parseAlibabaAcquisitionPayload(fetched = {}) {
  if (fetched.extracted) return fetched;
  const source = String(fetched.html || '');
  const isReader = fetched.acquisition === 'JINA_READER' || !/html/i.test(fetched.contentType || '');
  return {
    ...fetched,
    extracted: isReader ? parseAlibabaReaderText(source) : parseAlibabaProductHtml(source),
  };
}

export function acquisitionHasData(fetched = {}) {
  const extracted = fetched.extracted || {};
  return ['product', 'displayedPrice', 'moq', 'supplier', 'supplierCountry'].some((key) => isPresent(extracted[key]));
}

export function createAlibabaAcquisitionProviders({ officialApiProvider = null } = {}) {
  const providers = [];
  if (officialApiProvider && typeof officialApiProvider.fetch === 'function') {
    providers.push({ name: 'ALIBABA_OPEN_API', fetch: officialApiProvider.fetch });
  }
  if (piloterrConfigured()) {
    providers.push({ name: 'BROWSER', fetch: fetchAlibabaThroughPiloterr });
  }
  providers.push({ name: 'JINA_READER', fetch: fetchAlibabaThroughReader });
  return providers;
}

export async function acquireAlibabaProduct(url, { providers = createAlibabaAcquisitionProviders() } = {}) {
  const attempts = [];
  for (const provider of providers) {
    if (!provider || typeof provider.fetch !== 'function') continue;
    try {
      const fetched = parseAlibabaAcquisitionPayload(await provider.fetch(url));
      const hasData = acquisitionHasData(fetched);
      attempts.push({ provider: provider.name || 'UNKNOWN', status: hasData ? 'DATA' : 'EMPTY' });
      if (hasData) {
        return {
          fetched: { ...fetched, acquisition: fetched.acquisition || provider.name || 'UNKNOWN', acquisitionAttempts: attempts },
          acquisitionAttempts: attempts,
          acquisitionStatus: 'ACQUIRED',
        };
      }
    } catch (error) {
      attempts.push({ provider: provider.name || 'UNKNOWN', status: 'ERROR', error: error instanceof Error ? error.message : 'provider_failed' });
    }
  }
  return {
    fetched: null,
    acquisitionAttempts: attempts,
    acquisitionStatus: 'UNKNOWN',
  };
}

export function providerOrder(providers = []) {
  return providers.map((provider) => provider?.name || 'UNKNOWN');
}
