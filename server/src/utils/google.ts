import { googleClientId, redirectUrl } from "./constants.ts";

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export function getGoogleAuthUrl() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUrl,
    client_id: googleClientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
  };

  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}

export async function getTokens({
  code,
  clientId,
  clientSecret,
  redirectUrl,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  id_token: string;
}> {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUrl,
    grant_type: "authorization_code",
  };

  try {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(values).toString(),
    });

    if (!res.ok) {
      throw new Error(`Failed to get tokens: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error fetching tokens:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}
