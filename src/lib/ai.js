import { getAI, getGenerativeModel, GoogleAIBackend, ResponseModality } from 'firebase/ai'
import { app } from './firebase'

const ai = getAI(app, { backend: new GoogleAIBackend() })

export const imagenModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash-image',
  generationConfig: {
    responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
  },
})

export const geminiModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash-lite',
})

export const geminiFlashModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
})
