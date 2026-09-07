import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { type ZodError } from 'zod';
import { type BusinessCardData, BusinessCardSchema } from './schema';

// Form validation configurations
type FormErrors = Record<keyof BusinessCardData, string>;

export default function BusinessCardQRCodeGenerator() {
    // ========== Form data handling ==========
    const [formData, setFormData] = useState<BusinessCardData>({
        name: '',
        email: '',
        phone: '',
        website: ''
    });
    const [errors, setErrors] = useState<Partial<Record<keyof BusinessCardData, string>>>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [finalQrValue, setFinalQrValue] = useState<string>('');
    const [confirmationMessage, setConfirmationMessage] = useState<string>('');

    const generateVCardString = (data: BusinessCardData): string => {
        const vCardParts = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${data.name}`,
            `EMAIL:${data.email}`
        ];
        if (data.phone) vCardParts.push(`TEL:${data.phone}`);
        if (data.website) vCardParts.push(`URL:${data.website}`);
        vCardParts.push('END:VCARD');
        return vCardParts.join('\r\n');
    }

    const updateFormErrors = (zodError: ZodError<BusinessCardData>) => {
        const newErrors: Partial<Record<keyof BusinessCardData, string>> = {};
        zodError.issues.forEach((issue) => {
            const field = issue.path[0] as keyof BusinessCardData;
            newErrors[field] = issue.message;
        });
        setErrors(newErrors);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);

        if (!hasSubmitted) return;

        const result = BusinessCardSchema.safeParse(updatedFormData);
        if (result.success) {
            setErrors({});
        } else {
            const issueForField = result.error.issues.find((issue) => issue.path[0] === name);
            if (!issueForField) {
                setErrors((prevErrors) => {
                    const copy = { ...prevErrors };
                    delete copy[name as keyof BusinessCardData];
                    return copy;
                });
            } else {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    [name]: issueForField.message
                }));
            }
        }
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHasSubmitted(true);

        const result = BusinessCardSchema.safeParse(formData);

        if (result.success) {
            const vCardString = generateVCardString(result.data);
            setErrors({});
            setHasSubmitted(false);
            setFinalQrValue(vCardString);
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setConfirmationMessage(`New QR code successfully compiled at ${timestamp}!`);
        } else {
            updateFormErrors(result.error);
        }
    };

    // ========== QR Code download handling ==========
    const canvasRef = useRef<HTMLCanvasElement>(null); 
    const downloadQRCode = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // 1. Convert canvas rendering matrix to a raw image URL string stream
        const pngUrl = canvas.toDataURL("image/png");
      
        // 2. Create a temporary invisible anchor link element in memory
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
      
        // 3. Format filename by stripping spaces down to underscores
        downloadLink.download = `${formData.name.trim().replace(/\s+/g, '_')}_contact.png`;
      
        // 4. Temporarily attach, execute a programmatic click, and tear it back down out of the DOM
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
  };

    return (
         <form 
        onSubmit={handleSubmit} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem', 
          flex: '1', 
          maxWidth: '450px', // Prevents fields from stretching across the full screen width
          minWidth: '300px'
        }}
      >
        {/* Row 1: Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#374151' }}>Name *</label>
          <div>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.95rem' }} />
            {errors.name && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: '500' }}>{errors.name}</p>}
          </div>
        </div>

        {/* Row 2: Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#374151' }}>Email *</label>
          <div>
            <input type="text" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.95rem' }} />
            {errors.email && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: '500' }}>{errors.email}</p>}
          </div>
        </div>

        {/* Row 3: Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#374151' }}>Phone</label>
          <div>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.95rem' }} />
            {errors.phone && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: '500' }}>{errors.phone}</p>}
          </div>
        </div>

        {/* Row 4: Website */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#374151' }}>Website</label>
          <div>
            <input type="text" name="website" value={formData.website} onChange={handleInputChange} placeholder="example.com" style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.95rem' }} />
            {errors.website && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: '500' }}>{errors.website}</p>}
          </div>
        </div>

        {/* Submit alignment row */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem' }}>
          <div /> {/* Keeps button lined up exactly underneath the inputs */}
          <button type="submit" style={{ padding: '0.75rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'background 0.2s' }}>
            Generate QR Code
          </button>
        </div>

        {confirmationMessage && (
          <p style={{ color: '#15803D', fontWeight: '500', fontSize: '0.95rem', margin: '0' }}>{confirmationMessage}</p>
        )}

        {finalQrValue && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <QRCodeCanvas 
            ref={canvasRef} // 🌟 Connected hook pointer
            value={finalQrValue}
            size={200}
            level="H"
          />
          
          {/* Note: This button is OUTSIDE the <form> structure, so it safely executes downloadQRCode without re-triggering form validation checks! */}
          <button 
            onClick={downloadQRCode}
            style={{ width: '100%', padding: '0.6rem 1.2rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}
          >
            Download QR Code (PNG)
          </button>
        </div>
        )}
        <p style={{ fontSize: '0.85rem', color: '#6B7280', textAlign: 'center', marginTop: '0.75rem' }}>
          Powered by Codyza
        </p>
      
      </form>
    ); 
}