const ensureAuthenticated =  (req, res, next) => {
    // 一个Passport提供的函数
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("info", "You must be logged in to see this page.");
        res.redirect("/login");
    }
}

module.exports = {
    ensureAuthenticated
}