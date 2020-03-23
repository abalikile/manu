/* eslint linebreak-style: ["error", "windows"] */
/* global db print */
/* eslint no-restricted-globals: "off" */

db.products.remove({});
const productsDB = [
  {
    id: 1,
    productname: 'Nike',
    category: 'Shirts',
    price: 5,
    image: 'https://www.amazon.com/slp/womens-blue-shirt/j459qm6wnw577cs',
  },
  {
    id: 2,
    productname: 'Adidas',
    category: 'Jeans',
    price: 15,
    image: 'https://www.amazon.com/slp/womens-blue-shirt/j459qm6wnw577cs',
  },
];
db.products.insertMany(productsDB);
const count = db.products.count();
print('Inserted', count, 'products');
db.counters.remove({ _id: 'products' });
db.counters.insert({ _id: 'products', current: count });

db.products.createIndex({ id: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ productname: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ image: 1 });
