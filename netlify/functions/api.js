import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import checkToken from '../../config/checkToken.js'
import usersRouter from '../../routes/users.js'
import serverless from "serverless-http"

const api = express();

api.use(cors());
api.use(bodyParser.json());

api.use(checkToken)
api.use('/users', usersRouter)

mongoose.connect(process.env.DATABASE_URL)

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    stock: Number,
    image: String,
    category: String
})

const cartSchema = new mongoose.Schema({ 
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        quantity: Number
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const Product = mongoose.model("Product", productSchema)
const Cart = mongoose.model("Cart", cartSchema)

const router = Router()

router.get('/', (req, res) => {
    res.json({
        message: "Cosmic Backend Working"
    })
})


router.get('/products', async (req, res) => {
    try {
        const allProducts = await Product.find({})
        res.json(allProducts)
    } catch(e) {
        console.error(e)
    }
})

router.post('/products/new', (req, res) => {
    const product = req.body
    const newProduct = new Product({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image,
        category: product.category
    })
    newProduct.save()
    .then(() => {
        console.log("Product Saved")
        res.sendStatus(200)
    })
    .catch(e => console.error(e))
})


router.get('/products/search', async (req, res) => {
    const { query } = req.query
    console.log(query)
    try {
        const regex = new RegExp(query, 'i')
        const foundProducts = await Product.find({ $or: [{ name: regex }, { description: regex }] })
        console.log(foundProducts)
        res.json(foundProducts)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
});


router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        res.json(product)
    } catch (e) {
        console.error(e)
    }
})

router.delete('/products/:id', (req, res) => {
    Product.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })
})

router.put('/products/:id', (req, res) => {
    Product.updateOne({"_id": req.params.id}, {
        name: req.body.name, 
        description: req.body.description, 
        price: req.body.price,
        stock: req.body.stock,
        image: req.body.image,
        category: req.body.category
    })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })
})

router.post('/cart/add', async (req, res) => {
  try {
      const { productId, quantity, userId } = req.body;
      // Check if the user already has a cart or create one
      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = await Cart.create({ userId , products: [] });
      }
      // Check if the product is already in the cart
      const existingProductIndex = cart.products.findIndex(p => String(p.productId) === String(productId));
      if (existingProductIndex !== -1) {
          cart.products[existingProductIndex].quantity += quantity;
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

router.get('/cart', async (req, res) => {
    const userId = req.query.userId
  try {
      const cart = await Cart.findOne({ userId }).populate('products.productId'); 
      console.log(cart)
      res.json(cart);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

router.put('/cart/update/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.query.userId
        const cart = await Cart.findOne({ userId });
        const productIndex = cart.products.findIndex(p => String(p.productId) === String(productId)); // Correct comparison
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

router.delete('/cart/remove/:productId', async (req, res) => {
  try {
    const userId = req.query.userId
      const { productId } = req.params;
      const cart = await Cart.findOne({ userId })
      console.log("RUNNING" , cart.products)
      cart.products = cart.products.filter(p => String(p.productId) !== String(productId));
      await cart.save();
      res.sendStatus(200);
  } catch (error) {
      console.error(error);
      res.sendStatus(500);
  }
});

api.use("/api/", router)

export const handler = serverless(api)