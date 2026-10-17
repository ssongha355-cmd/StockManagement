export const getRelyingPartyId = (): string => {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
};

export const isBiometricsSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } 
  catch { return false; }
};

export const registerBiometrics = async (userId: string, userEmail?: string): Promise<boolean> => {
  if (!(await isBiometricsSupported())) return false;
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const rpId = getRelyingPartyId();

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'StockFolio', id: rpId },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail || 'user@stockfolio',
          displayName: userEmail || 'StockFolio User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (credential) {
      localStorage.setItem(`passkey_registered_${rpId}`, 'true');
      return true;
    }
  } catch (err: any) {
    if (err.name !== 'NotAllowedError') console.warn('WebAuthn creation error:', err);
  }
  return false;
};

export const authenticateBiometrics = async (): Promise<boolean> => {
  if (!(await isBiometricsSupported())) return false;
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: getRelyingPartyId(),
        timeout: 60000,
        userVerification: 'preferred',
      },
    });
    return !!assertion;
  } catch (err: any) {
    return false;
  }
};
