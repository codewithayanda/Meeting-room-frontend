export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
}