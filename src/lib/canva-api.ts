/**
 * Canva API Integration
 * 
 * This module provides functions to interact with Canva's API
 * for generating images from templates
 */

interface CanvaGenerateOptions {
  templateId: string;
  name: string;
  photoUrl: string;
  certifications?: string;
  country?: string;
  [key: string]: any;
}

/**
 * Generate an image from a Canva template
 * 
 * @param options - Options for generating the image
 * @returns Promise that resolves to a Blob of the generated image
 */
export async function generateCanvaImage(
  options: CanvaGenerateOptions
): Promise<Blob> {
  try {
    const response = await fetch('/api/canva/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: options.templateId,
        data: {
          name: options.name,
          photoUrl: options.photoUrl,
          certifications: options.certifications,
          country: options.country,
          ...options,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate image from Canva');
    }

    return await response.blob();
  } catch (error: any) {
    console.error('Error generating Canva image:', error);
    throw error;
  }
}

/**
 * Download a Canva-generated image
 * 
 * @param options - Options for generating the image
 * @param filename - Optional filename for the download
 */
export async function downloadCanvaImage(
  options: CanvaGenerateOptions,
  filename?: string
): Promise<void> {
  try {
    const blob = await generateCanvaImage(options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${options.name.replace(/\s+/g, '_')}_Yatri_Cloud_Certification.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error downloading Canva image:', error);
    throw error;
  }
}
