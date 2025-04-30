// Core Module
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const DB_PATH = "mongodb+srv://patsandy2022:sandy4438@cluster0.tkdp7.mongodb.net/airbnb?retryWrites=true&w=majority&appName=Cluster0"

//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const { default: mongoose, Collection } = require('mongoose');
const { authRouter } = require('./routes/authRouter');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded());
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});
app.use(session({
  secret: "This is the airbnb cookie",
  resave: false,
  saveUninitialized: true,
  store: store
}))
app.use((req,res,next)=>{
  req.isLoggedIn = req.session.isLoggedIn
  next();
})
app.use(storeRouter);
app.use(authRouter);
app.use("/host", (req,res,next)=>{
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login")
  }
})
app.use("/host", hostRouter);

app.use(express.static(path.join(rootDir, 'public')))

app.use(errorsController.pageNotFound);

const PORT = 3000;

mongoose.connect(DB_PATH).then(()=>{
  console.log("Connceted to the database");
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err=>{
  console.log("Error while connecting to the database", err);
})