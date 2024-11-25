const db = require('../utils/db.query')
const Logger = require('../utils/logger')

async function index(req, res, next) {
  try {
    if (typeof req.user != 'undefined') {
        res.render('index', await db.getLoggedInUserInfo(req));
    } else {
        res.render('index', await db.getNotLoggedInUserInfo(req));
    }
      
  } catch (err) {
      console.error(`Error while getting index page`, err.message);
      next(err);
  }
}

async function authSteam(req, res, next) {
    try {
        res.redirect('/')
    } catch (err) {
        console.error(`Error while authing Steam`, err.message);
        next(err);
    }
}

async function authSteamReturn(req, res, next) {
    try {
        res.redirect('/');
    } catch (err) {
        console.error(`Error while returning from Steam auth`, err.message);
        next(err);
    }
}

async function authLocal(req, res) {
    res.redirect('/');
}

async function destroySession(req, res) {
    Logger.sql.debug(`User logged out - ${JSON.stringify(req.user.id)}`)
    req.session.destroy(err => {
        res.redirect('/')
    })
}

async function deleteAccount(req, res) {

    req.session.destroy(err => {
        res.redirect('/')
    })
}

module.exports = {
  index,
  authSteam,
  authLocal,
  authSteamReturn,
  destroySession,
  deleteAccount
};