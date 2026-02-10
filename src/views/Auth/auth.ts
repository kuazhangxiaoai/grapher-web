export interface UserCredentials {
    username: string;
    password: string;
}

export interface RegisterData  {
    email: string;
    confirmPassword: string;
    username: string;
    nickName: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

