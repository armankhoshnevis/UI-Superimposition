// ui/src/api.js — talks to the Flask backend
import axios from 'axios'
 
const BASE_URL = 'http://localhost:5000'
 
export async function fetchScenarios() {
  const res = await axios.get(`${BASE_URL}/scenarios`)
  return res.data
}
 
export async function generateAudio(config) {
  const res = await axios.post(`${BASE_URL}/generate`, config)
  return res.data
}
 
export async function fetchAllFiles() {
  const res = await axios.get(`${BASE_URL}/files`)
  return res.data
}
 
export function audioUrl(file_url) {
  // file_url comes back as '/audio/foo.wav' — prepend backend host
  return `${BASE_URL}${file_url}`
}
