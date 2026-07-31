USE kstu_counseling;

-- Only Cleopas student account is seeded.
-- Default password: Password123!
-- Note: password hash below is a placeholder. Run `npm run seed` to insert a real bcrypt hash.
INSERT INTO users (student_id, full_name, email, password_hash, role, phone, department, programme, specialization, bio) VALUES
('052241360117', 'Cleopas Kwame Obbo', 'cleopas@student.kstu.edu.gh', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQsUeQKqHqHqHqHqHqHqHqHqHqHqHq', 'student', '0200000004', 'Computer Science', 'Computer Technology', NULL, NULL);
