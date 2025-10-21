/*
  # Create Appointments Table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key) - Unique identifier for each appointment
      - `user_id` (uuid, foreign key) - References auth.users, owner of the appointment
      - `title` (text) - Title of the appointment
      - `description` (text, nullable) - Detailed description of the appointment
      - `date` (date) - Date of the appointment
      - `time` (text) - Time of the appointment in HH:MM format
      - `created_at` (timestamptz) - Timestamp when appointment was created
      - `updated_at` (timestamptz) - Timestamp when appointment was last updated

  2. Security
    - Enable RLS on `appointments` table
    - Add policy for users to view their own appointments
    - Add policy for users to insert their own appointments
    - Add policy for users to update their own appointments
    - Add policy for users to delete their own appointments

  3. Indexes
    - Create index on `user_id` for faster queries
    - Create index on `date` for date-based filtering

  4. Notes
    - All timestamps use `timestamptz` for timezone support
    - Appointments are user-specific and protected by RLS
    - Soft deletes are not implemented; records are permanently deleted
*/

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- RLS Policies
CREATE POLICY "Users can view own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS appointments_updated_at_trigger ON appointments;
CREATE TRIGGER appointments_updated_at_trigger
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();
