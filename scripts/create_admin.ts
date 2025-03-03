import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const hashedPassword = await hashPassword("123456789");
  console.log("INSERT INTO users (username, password, name, role) VALUES ('vietdanh', '" + hashedPassword + "', 'Viet Danh', 'admin');");
}

main();
