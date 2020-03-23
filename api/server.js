/* eslint linebreak-style: ["error", "windows"] */
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const { ApolloServer, UserInputError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL || 'mongodb+srv://manutanu:641643@freecluster-nk7nh.mongodb.net/productinventory?retryWrites=true';

let db;


const GraphQLPrice = new GraphQLScalarType({
  name: 'GraphQLPrice',
  description: 'A Price type in GraphQL as a scalar',
  // serialize() will convert price value to string
  serialize(value) {
    return value.toString();
  },

  parseValue(value) {
    const first = value.replace(/[$]/g, '');
    return first;
  },

  parseLiteral(ast) {
    const temp = ast.value;
    if (ast.kind === Kind.Float) {
      const first = temp.replace(/[$]/g, '');
      return first;
    }
    return temp;
  },
});


async function productList() {
  const products = await db.collection('products').find({}).toArray();
  return products;
}

async function getNextSequence(name) {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { current: 1 } },
    { returnOriginal: false },
  );
  return result.value.current;
}

function productValidate(product) {
  const errors = [];
  if (product.productname.length < 1) {
    errors.push('Field "productname" is mandatory.');
  }
  if (product.price) {
    // 'Field "Price" cannot have alphabets. only two digits allowed after decimal places.'

    const regex = /^\s*-?[0-9]\d*(\.\d{1,2})?\s*$/;
    if (!regex.test(product.price)) {
      errors.push('Field "Price" invalid.');
    }
  }

  if (errors.length > 0) {
    throw new UserInputError('Invalid input(s)', { errors });
  }
}

async function productAdd(_, { product }) {
  productValidate(product);
  const newProduct = { ...product };
  newProduct.id = await getNextSequence('products');


  const result = await db.collection('products').insertOne(newProduct);
  const savedProduct = await db.collection('products')
    .findOne({ _id: result.insertedId });
  return savedProduct;
}
async function connectToDb() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
}
const resolvers = {
  Query: {
    productList,
  },
  Mutation: {
    productAdd,
  },
  GraphQLPrice,
};
const server = new ApolloServer({
  typeDefs: fs.readFileSync('schema.graphql', 'utf-8'),
  resolvers,
  formatError: (error) => {
    console.log(error);
    return error;
  },
});


const app = express();


server.applyMiddleware({ app, path: '/graphql' });
const port = process.env.API_SERVER_PORT || 3000;
(async function start() {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
