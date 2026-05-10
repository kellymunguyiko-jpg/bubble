export const CLOUDINARY_CLOUD_NAME = 'ddgbrwhcn';
export const CLOUDINARY_UPLOAD_PRESET = 'kellychat';

interface CloudinaryResponse {
  secure_url: string;
  resource_type: string;
  format: string;
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  return response.json();
};
