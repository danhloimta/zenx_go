export function isAtLeastAge(dateOfBirth: string | Date, age: number, today = new Date()) {
  const birth = typeof dateOfBirth === 'string' ? new Date(`${dateOfBirth}T00:00:00`) : dateOfBirth;
  if (Number.isNaN(birth.getTime())) return false;
  return today >= new Date(birth.getFullYear() + age, birth.getMonth(), birth.getDate());
}
