"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLineProfile = getLineProfile;
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';
async function getLineProfile(accessToken) {
    const res = await fetch(LINE_PROFILE_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401) {
        throw Object.assign(new Error('Invalid or expired LINE access token'), { status: 401 });
    }
    if (!res.ok) {
        throw Object.assign(new Error(`LINE API error: ${res.status}`), { status: 502 });
    }
    const data = (await res.json());
    if (!data.userId || !data.displayName) {
        throw Object.assign(new Error('Unexpected LINE profile response'), { status: 502 });
    }
    return data;
}
//# sourceMappingURL=line.js.map