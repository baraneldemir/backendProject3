import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt"
import  jwt from "jsonwebtoken";

const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})

mongoose.connect(process.env.DATABASE_URL)

const userSchema = new mongoose.Schema({
    fullname: {type: String, required: true},
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    admin: Boolean
})

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    stock: Number,
    image: String
})

const cartSchema = new mongoose.Schema({
    products: String,
    amount: Number,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const User = mongoose.model("User", userSchema)
const Product = mongoose.model("Product", productSchema)
const Cart = mongoose.model("Cart", cartSchema)

function createJWT(user) {
  return jwt.sign(
    { user },
    process.env.SECRET,
    { expiresIn: '24h' }
  );
}

function checkToken(req, res) {
  console.log('req.user', req.user)
  res.json(req.exp)
}

async function createUser (req, res) {
  try {
    console.log(req.body)
    const user = await User.create(req.body);
    console.log(user)
    const token = createJWT(user);
    res.json(token);
  }
  catch(e) {
    console.error(e)
    res.sendStatus(500)
  }
}

app.post('/users/new' , (req, res) => {
  createUser(req, res)
})

async function login (req, res) {
  try {
    console.log(req.body)
    const user = await User.create(req.body);
    console.log(user)
    const token = createJWT(user);
    res.json(token);
  }
  catch(e) {
    console.error(e)
    res.sendStatus(500)
  }
}

app.post('/users' , (req, res) => {
  login(req, res)
})



app.get('/', (req, res) => {
    res.json({
        message: "Cosmic Backend Working"
    })
})

app.get('/products', async (req, res) => {
    try {
        const allProducts = await Product.find({})
        res.json(allProducts)
    } catch(e) {
        console.error(e)
    }
})

app.post('/products/new', (req, res) => {
    const product = req.body
    const newProduct = new Product({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image
    })
    newProduct.save()
    .then(() => {
        console.log("Product Saved")
        res.sendStatus(200)
    })
    .catch(e => console.error(e))
})

app.get('/products/:id', async (req, res) => {
    const product = await Product.findById(req.params.id)
    res.json(product)
})

app.delete('/products/:id', (req, res) => {
    Product.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })
})

app.put('/products/:id', (req, res) => {
    Product.updateOne({"_id": req.params.id}, {
        name: req.body.name, 
        description: req.body.description, 
        price: req.body.price,
        stock: req.body.stock,
        image: req.body.image
    })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })
})

app.post('/cart/add', async (req, res) => {
  try {
      const { productId, quantity } = req.body;
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }
      // Check if the user already has a cart or create one
      let cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
          cart = await Cart.create({ userId: req.user._id, products: [] });
      }
      // Check if the product is already in the cart
      const existingProduct = cart.products.find(p => p.productId === productId);
      if (existingProduct) {
          existingProduct.quantity += quantity;
      } else {
          cart.products.push({ productId, quantity });
      }
      await cart.save();
      res.sendStatus(200);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

app.get('/cart', async (req, res) => {
  try {
      const cart = await Cart.findOne({ userId: req.user._id });
      res.json(cart);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

app.put('/cart/update/:productId', async (req, res) => {
  try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const cart = await Cart.findOne({ userId: req.user._id });
      const productIndex = cart.products.findIndex(p => p.productId === productId);
      if (productIndex !== -1) {
          cart.products[productIndex].quantity = quantity;
          await cart.save();
          res.sendStatus(200);
      } else {
          res.status(404).json({ message: 'Product not found in the cart' });
      }
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

app.delete('/cart/remove/:productId', async (req, res) => {
  try {
      const { productId } = req.params;
      const cart = await Cart.findOne({ userId: req.user._id });
      cart.products = cart.products.filter(p => p.productId !== productId);
      await cart.save();
      res.sendStatus(200);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});



