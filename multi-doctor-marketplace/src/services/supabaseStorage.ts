import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Optimizes and compresses an image before uploading:
 * - Max width: 1200px (preserves aspect ratio)
 * - Compression: 0.7 JPEG for lightweight, ultra-fast cloud sync
 */
export async function optimizeImage(uri: string): Promise<string> {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (e) {
    console.warn('[ImageOptimizer] Compression fallback, using original:', e);
    return uri;
  }
}

/**
 * Converts a local file URI (from Expo ImagePicker or Audio) to an ArrayBuffer/Blob and uploads it to Supabase Storage.
 */
export async function uploadDentalMedia(
  uri: string,
  folder: 'photos' | 'audio' | 'clinic' | 'portfolio',
  userId: string = 'anonymous',
  userRole: 'patient' | 'doctor' = 'patient'
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return uri;
  }

  try {
    let uploadUri = uri;
    if (folder !== 'audio') {
      uploadUri = await optimizeImage(uri);
    }

    const ext = folder === 'audio' ? (uri.split('.').pop() || 'm4a') : 'jpg';
    
    let pathPrefix = `consultations/${userId}`;
    if (userRole === 'doctor') {
      pathPrefix = `doctors/${userId}/${folder}`;
    }

    const fileName = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const response = await fetch(uploadUri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { data, error } = await supabase.storage
      .from('dental-media')
      .upload(fileName, arrayBuffer, {
        contentType: folder === 'audio' ? 'audio/m4a' : 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return uri; // Fallback to local URI
    }

    const { data: publicUrlData } = supabase.storage
      .from('dental-media')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Failed to upload media to Supabase:', err);
    return uri;
  }
}

export async function uploadDentalPhoto(uri: string, userId: string = 'anonymous'): Promise<string> {
  const result = await uploadDentalMedia(uri, 'photos', userId, 'patient');
  return result || uri;
}

export async function uploadDentalAudio(uri: string, userId: string = 'anonymous'): Promise<string> {
  const result = await uploadDentalMedia(uri, 'audio', userId, 'patient');
  return result || uri;
}

export async function uploadDoctorAvatar(uri: string, doctorId: string): Promise<string> {
  const result = await uploadDentalMedia(uri, 'clinic', doctorId, 'doctor');
  return result || uri;
}

export async function uploadDoctorCover(uri: string, doctorId: string): Promise<string> {
  const result = await uploadDentalMedia(uri, 'clinic', doctorId, 'doctor');
  return result || uri;
}

export async function uploadPortfolioImage(uri: string, doctorId: string): Promise<string> {
  const result = await uploadDentalMedia(uri, 'portfolio', doctorId, 'doctor');
  return result || uri;
}
