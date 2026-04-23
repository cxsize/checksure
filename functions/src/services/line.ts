import type { LineProfile } from '../types';

const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw Object.assign(new Error('Invalid or expired LINE access token'), { status: 401 });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`LINE API error: ${res.status}`), { status: 502 });
  }

  const data = (await res.json()) as LineProfile;
  if (!data.userId || !data.displayName) {
    throw Object.assign(new Error('Unexpected LINE profile response'), { status: 502 });
  }

  return data;
}
