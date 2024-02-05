const ensureLoggedIn = function(req, res, next) {
    if (!req.user) return res.status(401).json('Unauthorised')

    next()
}

export default ensureLoggedIn