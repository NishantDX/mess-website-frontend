// Update the User type to include student fields
export type User = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  student_id?: string;  // Student-specific field
  department?: string;  // Student-specific field
  role: "student" | "admin";  // Role field for authorization
};