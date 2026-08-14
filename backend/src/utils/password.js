import bcrypt from 'bcrypt'
const SALT = 12
export const hashPassword = async (password) => {
 return await bcrypt.hash(password, SALT)
}
export const comparedPassword = async (password, hashPassword) => {
    return await bcrypt.compare(password, hashPassword)
}
