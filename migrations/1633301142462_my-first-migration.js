/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
	pgm.sql(`
    CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(40) NOT NULL,
      last_name VARCHAR(40) NOT NULL,
      email VARCHAR(60) NOT NULL,
      password VARCHAR(200) NOT NULL,
      address VARCHAR(240) NOT NULL,
      phone VARCHAR(15) NOT NULL, 
      signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_seen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      avatar_url VARCHAR(240) 
    );
    CREATE TABLE kitchens(
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(60) NOT NULL,
      address VARCHAR(240) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      avatar_url VARCHAR(240)
    );
    CREATE TABLE chefs(
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(40) NOT NULL,
      last_name VARCHAR(40) NOT NULL,
      email VARCHAR(60) NOT NULL,
      password VARCHAR(200) NOT NULL,
      address VARCHAR(240) NOT NULL,
      phone VARCHAR(15) NOT NULL, 
      signup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_seen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      kitchen_id INTEGER REFERENCES kitchens(id) 
        ON DELETE SET NULL,
      avatar_url VARCHAR(240)  
    );
    CREATE TABLE menu_items(
      id SERIAL PRIMARY KEY,
      kitchen_id INTEGER REFERENCES kitchens(id) ON DELETE SET NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(1000) NOT NULL,
      price NUMERIC NOT NULL,
      photo_primary_url VARCHAR(240),
      gallery_photo_urls VARCHAR(240)[],
      tags VARCHAR(40)[]
    );
    CREATE TABLE orders(
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
      kitchen_id INTEGER REFERENCES kitchens(id) ON DELETE SET NULL,
      users_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status INTEGER DEFAULT 0,
      date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      date_fulfilled TIMESTAMP WITH TIME ZONE
    );
    CREATE TABLE order_status(
      id SERIAL PRIMARY KEY,
      identifier INTEGER UNIQUE,
      meaning VARCHAR(40) UNIQUE
    );
    CREATE TABLE posts(
      id SERIAL PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      content VARCHAR(1000) NOT NULL,
      tags VARCHAR(40)[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      image_url VARCHAR(240)
    );
    CREATE TABLE comments(
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id),
      author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      author_kitchen_id INTEGER REFERENCES kitchens(id) ON DELETE SET NULL,
      author_type VARCHAR(20) NOT NULL,
      content VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE users_post_ref(
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL
    );
    CREATE TABLE kitchens_post_ref(
      id SERIAL PRIMARY KEY,
      kitchen_id INTEGER REFERENCES kitchens(id) ON DELETE SET NULL,
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL
    );
  `);
};

exports.down = (pgm) => {
	pgm.sql(`
    DROP TABLE kitchens_post_ref;
    DROP TABLE users_post_ref;
    DROP TABLE comments;
    DROP TABLE posts;
    DROP TABLE order_status;
    DROP TABLE orders;
    DROP TABLE menu_items;
    DROP TABLE chefs;
    DROP TABLE kitchens;
    DROP TABLE users;
  `);
};
