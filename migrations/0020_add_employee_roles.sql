CREATE TABLE IF NOT EXISTS employee_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS employee_roles_user_idx
  ON employee_roles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS employee_roles_user_role_idx
  ON employee_roles (user_id, role);

INSERT INTO employee_roles (user_id, role)
SELECT employees.user_id, users.role
FROM employees
INNER JOIN users ON users.id = employees.user_id
WHERE users.role IN ('supervisor', 'drc', 'drc_convener', 'drc_chairman', 'irc', 'doaa', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;