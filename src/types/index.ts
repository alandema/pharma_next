// Shared TypeScript type definitions for the application

export interface User {
    id: number;
    username: string;
    role: 'doctor' | 'pharmacist' | 'admin';
}

export interface Patient {
    id: number;
    name: string;
    cpf: string;
    birth_date: string;
    address?: string;
    phone?: string;
}

export interface Medication {
    id: number;
    name: string;
    dosage: string;
    quantity: number;
    unit: string;
}

export interface CID {
    id: number;
    code: string;
    description: string;
}

export interface Prescription {
    id: number;
    patient_id: number;
    doctor_id: number;
    cid_id: number;
    medication_id: number;
    dosage: string;
    frequency: string;
    duration: string;
    created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Form data types
export type PatientFormData = Omit<Patient, 'id'>;
export type MedicationFormData = Omit<Medication, 'id'>;
export type PrescriptionFormData = Omit<Prescription, 'id' | 'created_at'>;
