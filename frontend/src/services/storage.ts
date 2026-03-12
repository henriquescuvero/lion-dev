import { supabase } from '@/lib/supabase'

export async function uploadImage(file: File, projectId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('project-images')
    .upload(path, file, { contentType: file.type })

  if (error) throw new Error(`Upload failed: ${error.message}`)
  return path
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('project-images')
    .getPublicUrl(path)
  return data.publicUrl
}

export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
