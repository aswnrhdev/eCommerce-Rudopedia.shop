const express = require("express");
const app = express();
const nocache = require("nocache");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const blocked = require("./middleware/blocked");
const adminRoute = require("./routes/adminRoute");

const userRoute = require("./routes/userRoute");

const MongoDBStore = require("connect-mongodb-session")(session);
// mongoose.connect("mongodb+srv://aswnrh:Aswin123@rudoshop.eh8gexg.mongodb.net/");
mongoose.connect(process.env.mongo_DB)

const store = new MongoDBStore({
  // uri: "mongodb+srv://aswnrh:Aswin123@rudoshop.eh8gexg.mongodb.net/",
  uri: process.env.mongo_DB,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "./views");
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/assetsAdmin", express.static(path.join(__dirname, "assetsAdmin")));
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    store: store,
  })
);

app.use("/admin", adminRoute);
app.use("/home", adminRoute);
app.use("/users", adminRoute);
app.use("/products", adminRoute);
app.use("/addProduct", adminRoute);
app.use("/", adminRoute);
app.use("/addCategory", adminRoute);
app.use("/editCategory", adminRoute);
app.use("/category", adminRoute);

app.use(blocked.isBlocked);

app.use("/", userRoute);

app.listen(3000, () => {
  console.log(
    `Server is successfully running. Click here for more info: \x1b[34mhttp://localhost:3000`
  );
});
