export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface AuthResponse {
  customToken: string;
}

export interface ErrorResponse {
  error: string;
}
