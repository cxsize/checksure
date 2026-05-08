import type { LineProfile } from '../types';

const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

// In emulator mode, return a fixed test profile so dev login always gets the same UID
const DEV_PROFILE: LineProfile = {
  userId: 'U_dev_test_user',
  displayName: 'Dev Tester',
  pictureUrl: '',
};

export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  // Emulator / demo project — skip real LINE API
  if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.GCLOUD_PROJECT?.startsWith('demo-')) {
    return DEV_PROFILE;
  }

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
