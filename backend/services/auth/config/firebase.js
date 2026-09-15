import {cert, initializeApp} from 'firebase-admin'
import serviceAccountKey from '../serviceAccountKey.json' with {type:"json"}

/*
* Firebase for using Continue with Google Service
*/
export const app = initializeApp({

    credential:cert(serviceAccountKey)
})