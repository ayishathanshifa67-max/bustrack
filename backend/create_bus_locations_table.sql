-- Create table for storing latest bus locations
CREATE TABLE IF NOT EXISTS bus_locations (
  bus_id INT PRIMARY KEY,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  -- Optionally add a foreign key to a buses table if you have one:
  -- , FOREIGN KEY (bus_id) REFERENCES buses(id)
);
-- Create bus_locations table
-- Note: Adjust data types and foreign key target (buses.id) as needed for your schema
CREATE TABLE IF NOT EXISTS bus_locations (
  bus_id INT PRIMARY KEY,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Uncomment the next line if you have a 'buses' table with id as INT
  -- FOREIGN KEY (bus_id) REFERENCES buses(id)
  INDEX (bus_id)
);
