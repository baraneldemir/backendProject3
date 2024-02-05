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

const SALT_ROUNDS = 6

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
app.get('/users/:id' , async (req, res) => {
  const user = await User.findById(req.params.id)
  res.json(user)
})

async function login(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new Error();
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw new Error();
    res.json( createJWT(user) );
    } 
    catch { res.status(400).json('Bad Credentials'); }

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

