const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressVaidator = require('express-validator');
const Sequelize = require('sequelize');
const Deck;
const Flipcard;

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', './views');
app.use(bodyParser.urlencoded());
app.use(expressVaidator());

//define users
var users = [];
users.push({id: 1, displayName: 'User', username: 'user', password:'user'});

//set secret for session cookie
app.use(session({
  secret: '7h31r0ny4rd',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static('views'));

//==================================SEQUELIZE
// Database connection
sequelize = new Sequelize( 'flipcards', 'Danny', null, {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432
});

sequelize
    .authenticate()
    .complete( function( err ) {
        if ( !!err ) {
            console.log( 'Unable to connect to the database:', err );
        } else {
            console.log( 'Connection has been established successfully.' );
            defineModels();
            defineAssociations();
            syncDatabase();
        }
    });

// Create the database schema (models)
function defineModels() {
    Deck = sequelize.define( 'Deck', {
        title: {
            type: Sequelize.STRING,
            defaultValue: 'null'
        }
    });

    Flipcard = sequelize.define( 'Flipcard', {
        question: {
            type: Sequelize.STRING,
            defaultValue: 'null'
        },
        answer: {
            type: Sequelize.STRING,
            defaultValue: 'null'
        }
    });
}

// table relationships
function defineAssociations() {
    Deck.hasMany( Flipcard );
    Flipcard.belongsTo( Deck );
}

// create the database schema if it doesn't already exist
function syncDatabase() {
    sequelize.sync().complete( function( err ) {
        if ( !!err ) {
            console.log( 'The instance has not been saved:', err );
        } else {
            console.log( 'We have a persisted instance now' );
        }
    });
}
//==================================SEQUELIZE

// authentication middleware
app.use(function(req, res, next) {
    if (req.session.isAuthenticated === undefined) {
        req.session.isAuthenticated = false;
    }
    next();
});

var auth = function(req, res, next) {
  if (req.session && req.session.username === username && req.session.admin)
    return next();
  else
    return res.sendStatus(403);
};

//set default static server path
app.use(express.static('public'));

//check for authentication on success
app.get('/success', (req, res) => {
  if (req.session.isAuthenticated === false) {
    res.sendStatus(403);
  } else {
    var model = {
            displayName: req.session.displayName,
        }
        res.render('./success', model);
  }
});

//routes
app.get('/', (req, res) => {
    if(req.session.isAuthenticated === false) {
        res.redirect('login');
    }
    else {
        var model = {
            displayName: req.session.displayName,
        }
        res.render('./success', model);
    }
});

app.get("/signup", (req, res) => {
  res.render('signup');
})

app.get("/login", (req, res) => {
  res.render('login');
})

//signup-action
app.post('/signup', (req, res) => {
    var user = {
        id: (users.length),
        displayName: req.body.displayName,
        username: req.body.username,
        password: req.body.password,
    }
    console.log(user);
    users.push(user);
    var model = {
            displayName: req.session.displayName,
        }
        res.render('./success', model);
});

// login action
app.post('/', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var authenticateUser = users.find(function(q) {
        return q.username === username && q.password === password;
    });
    if(authenticateUser) {
        req.session.isAuthenticated = true;
        req.session.username = authenticateUser.username;
        req.session.displayName = authenticateUser.displayName;
        var model = {
            displayName: authenticateUser.displayName,
        }
        res.render('./success', model);
    }
    else {
        res.render('login');
    }
});

// logout
app.get('/logout', function(req, res) {
  var model = {
            displayName: req.session.displayName,
        }
        res.render('./logout', model);
        req.session.destroy();
});

app.listen('3000');
