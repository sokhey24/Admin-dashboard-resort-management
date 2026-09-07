export default {
  base_url: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/",
  image_path: import.meta.env.VITE_IMAGE_URL ?? "http://localhost:8000/storage/",
}
