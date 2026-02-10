import bcrypt from "bcryptjs";

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!hashedPassword?.startsWith("$2")) {
    return plainPassword === hashedPassword;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
}
