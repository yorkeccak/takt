export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function isOAuthConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VALYU_CLIENT_ID &&
    process.env.NEXT_PUBLIC_VALYU_AUTH_URL &&
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );
}

export async function initiateOAuthFlow() {
  if (!isOAuthConfigured()) {
    console.warn(
      "OAuth is not configured. Set NEXT_PUBLIC_VALYU_CLIENT_ID, NEXT_PUBLIC_VALYU_AUTH_URL, and NEXT_PUBLIC_REDIRECT_URI."
    );
    return;
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem("oauth_code_verifier", codeVerifier);
  localStorage.setItem("oauth_timestamp", Date.now().toString());

  const state = generateCodeVerifier();
  localStorage.setItem("oauth_state", state);

  const authUrl = new URL(
    "/auth/v1/oauth/authorize",
    process.env.NEXT_PUBLIC_VALYU_AUTH_URL
  );
  authUrl.searchParams.append(
    "client_id",
    process.env.NEXT_PUBLIC_VALYU_CLIENT_ID!
  );
  authUrl.searchParams.append(
    "redirect_uri",
    process.env.NEXT_PUBLIC_REDIRECT_URI!
  );
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", "openid profile email");
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  authUrl.searchParams.append("state", state);

  window.location.href = authUrl.toString();
}

export interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  updated_at?: string;
}
