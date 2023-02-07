require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const { request } = require('http');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const expireTime = 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

//Users and Passwords (in memory 'database')
var users = []; 

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.use(express.urlencoded({extended: false}));

app.use("/public", express.static("./public"));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.crihai6.mongodb.net/?retryWrites=true&w=majority`,
    crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.get('/', (req,res) => {
        var signup = `
    <form action='/signup' method='get'>
    <button>signup</button>
    </form>
    <form action='/login' method='get'>
    <button>login</button>
    </form>
    `;
    res.send(signup);
});

app.get('/signup', (req, res) => {
    var html = `
      Create user:
      <form action='/submitUser' method='post'>
        <input name='name' type='text' placeholder='name' required>
        <input name='email' type='text' placeholder='email' required>
        <input name='password' type='password' placeholder='Password' required>
        <button>Submit</button>
      </form>
    `;
    res.send(html);
  });

  app.post('/submitUser', (req,res) => {
    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({ name: name, password: hashedPassword, email: email});

    console.log(users);
    res.redirect('/');

});

app.get('/login', async(req,res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button type='submit'>Submit</button>
    </form>
    `;
    res.send(html);
});

app.post('/loggingin', async(req,res) => {
    var email = req.body.email;
    var password = req.body.password;


    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                console.log('hi--------')
                req.session.authenticated = true;
                req.session.name = users[i].name;
                req.session.cookie.maxAge = expireTime;                
                res.redirect('/members');
                return
            }
        }
    }

    //user and password combination not found

        res.redirect("/");

});


app.get('/members', (req,res) => {
    if (!req.session.authenticated) {
        console.log('hi', req.session)
        res.redirect('/login');
        return
    }
    var name = req.session.name;
    var html = `
    Hello, ` + name + `
    <img src='/public/fluffy.gif' style='width:250px;'
    <form action= '/logout' method='post'>
    <button>Signout</button>
    </form>
    `;
    res.send(html);
});

app.get('/logout', (req,res) =>{
    req.session.destroy();
    res.redirect('/')
})



app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})


app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 