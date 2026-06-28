import { supabase } from './supabaseClient';

export const extractDataFromImage = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1600;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Cannot get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64Data = dataUrl.split(',')[1];
        const mimeType = 'image/jpeg';

        try {
          const { data, error } = await supabase.functions.invoke('process-personnel-image', {
            body: { imageBase64: base64Data, mimeType },
          });

          if (error) {
             let errorMsg = error.message;
             try {
                if (error.context && typeof error.context.text === 'function') {
                   const errText = await error.context.text();
                   errorMsg += ' - ' + errText;
                }
             } catch (e) {}
             throw new Error(errorMsg);
          }
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = (error) => reject(error);
  });
};
