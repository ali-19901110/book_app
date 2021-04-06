CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY ,
    author LONGTEXT,
    title  LONGTEXT,
    isbn   LONGTEXT,
    image_url LONGTEXT,
    description LONGTEXT
)