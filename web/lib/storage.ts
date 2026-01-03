import { put, del } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 * @param file - The file to upload (File or Buffer)
 * @param filename - The desired filename
 * @param folder - Optional folder path (e.g., 'avatars', 'photos')
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  folder?: string
): Promise<string> {
  try {
    const pathname = folder ? `${folder}/${filename}` : filename;
    
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return blob.url;
  } catch (error) {
    console.error('Upload file error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete a file from Vercel Blob storage
 * @param url - The URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Upload user avatar/photo
 * @param userId - The user ID
 * @param file - The image file
 * @returns The URL of the uploaded avatar
 */
export async function uploadUserAvatar(
  userId: string,
  file: File | Buffer
): Promise<string> {
  const filename = `${userId}.jpg`;
  return uploadFile(file, filename, 'avatars');
}

/**
 * Delete user avatar/photo
 * @param url - The URL of the avatar to delete
 */
export async function deleteUserAvatar(url: string): Promise<void> {
  return deleteFile(url);
}

