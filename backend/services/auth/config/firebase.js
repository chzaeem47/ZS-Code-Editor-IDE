import {cert, initializeApp} from 'firebase-admin'
import serviceAccountKey from '../serviceAccountKey.json' with {type:"json"}

export const app = initializeApp({

    credential:cert(serviceAccountKey)
})