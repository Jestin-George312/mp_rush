export type Role = 'student' | 'guide' | 'coordinator';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    picture?: string;
    department?: string;
}
