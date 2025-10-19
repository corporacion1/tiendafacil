import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const encrypt = async (data: string): Promise<string> => {
  return await bcrypt.hash(data, SALT_ROUNDS);
};

export const compareEncrypted = async (data: string, encrypted: string): Promise<boolean> => {
  return await bcrypt.compare(data, encrypted);
};