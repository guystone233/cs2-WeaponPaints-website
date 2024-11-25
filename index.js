console.clear()

const express = require('express');
const bodyParser = require('body-parser');
const { startup } = require('./src/utils/startup')

const path = require('path')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);

const Logger = require('./src/utils/logger')
const config = require('./config.json')

const app = express();
const port = config.PORT || 27275;


// Required to get data from user for sessions
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
// Initiate Strategy

passport.use(new LocalStrategy(
    {
      usernameField: 'id',
      passwordField: 'password', // useless
      passReqToCallback: true
    },
    (req, username, password, done) => {
      Logger.core.info(`Steam ID: ${username} is being authenticated`)
      const user = { id: username, username: username };
      return done(null, user);
    }
  ));

const sessionStore = new MySQLStore(config.DB);
app.use(session({
    store: sessionStore,
    secret: config.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
}))
app.use(passport.initialize());
app.use(passport.session());

const mainRouter = require('./src/routes/mainRouter.route');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, '/web/public')))
app.use('/', mainRouter);

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/web/views'))

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({'message': err.message});
  
  return;
});

const server = app.listen(port, config.INTERNAL_HOST, () => {
    startup()
    Logger.core.info(`App listening at ${config.PROTOCOL}://localhost:${port}`)
});

const io = require("socket.io")(server);

const weaponSocketHandler = require('./src/listeners/weapon.listener');

const onConnection = (socket) => {
    weaponSocketHandler(io, socket);
}

io.on("connection", onConnection);

sessionStore.onReady()
    .then(() => {
        Logger.sql.info('MySQLStore ready')
    })
