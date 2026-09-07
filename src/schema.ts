import { z } from 'zod';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

export interface BusinessCardData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
}

export const BusinessCardSchema = z.object({
  name: z.string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ' '))
    .pipe(z.string().min(1, { message: "Name is required." }).max(70, { message: "Name must be at most 70 characters long." })),
  email: z.string()
    .trim()
    .min(1, {message: "Email is required."})
    .pipe(z.email({ message: "Please enter a valid email address." })),
  phone: z.string()
    .trim()
    .optional()
    .transform((value) => {
        if (!value) return undefined;
        try {
            const parsedNumber = parsePhoneNumberWithError(value, 'US');
            if (!parsedNumber || !parsedNumber.isValid()) return "INVALID_PHONE_NUMBER";
            return parsedNumber.number; 
        } catch (error) {
            return "INVALID_PHONE_NUMBER";
        }
    })
    .refine((value) => {
        if (!value) return true;
        if (value === "INVALID_PHONE_NUMBER") return false;
        return true;
    }, { message: "Please enter a valid phone number." }),
  website: z.string()
    .trim()
    .optional()
    .refine((value) => {
        if (!value) return true;
        if (!/^[a-zA-Z0-9]/.test(value)) return false;
        return true;
    })
    .transform((value) => {
        if (!value) return undefined;
        if (!/^https?:\/\//.test(value)) return `https://${value}`;
        return value;
    })
    .pipe(z.httpUrl({ message: "Please enter a valid website URL." }).optional())
});