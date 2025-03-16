import CryptoJS from "crypto-js"

// 암호화 키는 사용자의 ID와 결합하여 사용자별로 다른 키를 생성합니다
const getEncryptionKey = (userId: string) => {
  return `${userId}-${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 16)}`
}

// 데이터 암호화 함수
export const encryptData = (data: string, userId: string): string => {
  const key = getEncryptionKey(userId)
  return CryptoJS.AES.encrypt(data, key).toString()
}

// 데이터 복호화 함수
export const decryptData = (encryptedData: string, userId: string): string => {
  const key = getEncryptionKey(userId)
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

