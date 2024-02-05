import express from 'express'
import usersCtrl from '../controllers/users.js'
import ensureLoggedIn from '../config/ensureLoggedIn.js'

const router = express.Router()

router.get('/check-token', ensureLoggedIn, usersCtrl.checkToken)
router.post('/', usersCtrl.create)
router.post('/login', usersCtrl.login)

export default router