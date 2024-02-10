import User from '../models/user.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const usersCtrl = {
    create,
    login,
    checkToken
}

async function create(req, res) {
    try {
        const user = await User.create(req.body)

        const token = createJWT(user)
        res.json(token)
    } catch {
        res.status(400).json('No userData')
    }
}

async function login(req, res) {
    try {
        const user = await User.findOne({ email: req.body.email})
        if (!user) throw new Error()

        const matching = await bcrypt.compare(req.body.password, user.password) 
       
        if (!matching) throw new Error()

        const token = createJWT(user)
        res.json(token)
    } catch(e) {
        res.status(400).json({
            message: e.message,
            reason: 'Bad Credentials'
        })
    }
}

function checkToken(req, res) {
   
    res.json(req.exp)
}

// Helper functions
function createJWT(user) {
    return jwt.sign(
        { user },
        process.env.SECRET,
        { expiresIn: '24h'}
        )
}

export default usersCtrl