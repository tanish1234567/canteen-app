const https = require("https");
const querystring = require('querystring');
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/userdb", { useNewUrlParser: true });
app.use(express.static("public"));
app.set('view engine', 'ejs');
var Publishable_Key = 'pk_test_51LQujwSC4kCw36JJcP3Mjsh1LU5nA7yRdqJXWuoCoj12S25UJtqytfR4kRzPVoLDxsDEfQpMlZfh5IkkppJHfMCx00AV080qXd';
var Secret_Key = 'sk_test_51LQujwSC4kCw36JJtxfQ3ZBjUs6lDLoRs8PLCLealxv0ffCpARp9H1ugVcA5P3IPSWNNKdcW86rLO1LavtEWnjaz00G3vCk7pG';
const stripe = require('stripe')(Secret_Key);
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const itemSchema = new mongoose.Schema({
    name: String,
    img: String,
    price: Number
});
console.log("1");
const itemModel = module.exports = new mongoose.model("item", itemSchema);
console.log("2");
const orderSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    price: Number,
    order: String
});
const orderModel = new mongoose.model("order", orderSchema);
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    itemsSelected: [itemSchema]
});
const userModel = new mongoose.model("user", userSchema);
app.get("/", (req, res) => {
    console.log("3");
    res.render("login/homelogin", { message: null });
});
app.get("/login", (req, res) => {
    console.log("4");
    res.render("login/login");
});
app.get("/register", (req, res) => {
    console.log("5");
    res.render("login/register");
});
app.post("/register", (req, res) => {
    console.log("6");
    let name = req.body.personname;
    let email = req.body.username;
    let password = req.body.password;
    console.log("7");
    if (userModel.findOne({ email: email }, (err, enteredemail) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("8");
            if (enteredemail) {
                console.log("9");
                res.render("login/homelogin", { message: "You are already registered.Try logging in" });
            }
            else {
                console.log("10");
                bcrypt.hash(password, saltRounds, function (err, hash) {
                    console.log("11");
                    if (err) {
                        console.log("12");
                        console.log(err);
                    }
                    else {
                        console.log("13");
                        let user1 = new userModel({
                            name: name,
                            email: email,
                            password: hash
                        });
                        user1.save();
                        itemModel.find({}, (err, array) => {
                            console.log("14");
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("15");
                                res.render("canteen", { items: array, name: name });
                            }
                        });
                    }
                });
            }
        }
    }));
});
app.post("/login", (req, res) => {
    console.log("16");
    let email = req.body.username;
    let password = req.body.password;
    if (userModel.findOne({ email: req.body.username }, function (err, detailsofuser) {
        console.log("17");
        if (err) {
            console.log("18");
            console.log(err);
        }
        else {
            console.log("19");
            console.log(detailsofuser);
            bcrypt.compare(password, detailsofuser.password, function (err, result) {
                console.log("20");
                if (err) {
                    console.log("21");
                    console.log(err);
                }
                else {
                    if (result === true) {
                        if (email === "admin@admin") {
                            console.log("22");
                            res.render("merchant", { msg: null });
                        }
                        else {
                            console.log("23");
                            itemModel.find({}, (err, array) => {
                                if (err) {
                                    console.log("24");
                                    console.log(err);
                                } else {
                                    console.log("25");
                                    res.render("canteen", { items: array, name: detailsofuser.name });
                                }
                            });
                        }
                    }
                    else {
                        console.log("26");
                        res.render("login/homelogin", { message: "The entered username or password is incorrect. Please try again" });
                    }
                }
            });
        }
    }));
});
app.get("/cart", (req, res) => {
    console.log("27");
    res.render("cart");
});
app.post("/merchant", (req, res) => {
    console.log("28");
    let itemname = req.body.nameofitem;
    let price = req.body.priceofitem;
    let imgUrl = req.body.imgUrl;
    let item1 = new itemModel({
        name: itemname,
        img: imgUrl,
        price: price
    });
    item1.save();
    console.log("29");
    res.render("merchant", { msg: "item added successfully" });
});
app.get("/deleteitem", (req, res) => {
    console.log("30");
    res.render("deleteitem", { msg: null });
});
app.post("/deleteitem", (req, res) => {
    console.log("31");
    let itemtobedeleted = req.body.nameofitem;
    console.log(itemtobedeleted);
    itemModel.findOneAndDelete({ name: itemtobedeleted }, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("33");
            res.render("deleteitem",{ msg: "item deleted successfully" });
        }
    })
});
app.get("/merchant", (req, res) => {
    console.log("34");
    res.render("merchant", { msg: null });
});
app.post("/checkout", (req, res) => {
    console.log("35");
    let inputofcheckoutformstring = req.body.inputofcheckoutform;
    let total = 0;
    inputofcheckoutformarr = JSON.parse(inputofcheckoutformstring);
    console.log("36");

    for (let i = 0; i < inputofcheckoutformarr.length; i++) {
        total += inputofcheckoutformarr[i].productPrice * inputofcheckoutformarr[i].productQuantity;
    }
    console.log("37");
    res.render("paybill", { items: inputofcheckoutformarr, totalamount: total ,order:inputofcheckoutformstring});
});
app.post("/payamount", (req, res) => {
    console.log("38");
    let totalPrice = parseInt(req.body.totalprice)*100;
    let phone = req.body.phone;
    let email = req.body.email;
    let name = req.body.name;
    let order = req.body.order;
    console.log(order);
    res.render("pay",{key: Publishable_Key,amount:totalPrice,order:order,personname:name});
});
app.post('/payment', function(req, res){
 
    // Moreover you can take more details from user
    // like Address, Name, etc from form
    console.log(req.body.order);
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: req.body.name,
        phone:req.body.phone,
        order:req.body.order
    })
    .then((customer) => {
 
        return stripe.charges.create({
            amount: req.body.amount,     // Charing Rs 25
            description: 'Canteen food',
            currency: 'INR',
            customer: customer.id
        });
    })
    .then((charge) => {
        let object2 = new orderModel({
            name:req.body.name,
            email: req.body.stripeEmail,
            price: req.body.amount,
            order: JSON.stringify(req.body.order)
        })
        object2.save();
        res.render("success",{items:order});  // If no error occurs
    })
    .catch((err) => {
        res.send(err);       // If some error occurs
    });
});
app.get("/ordersrecieved", (req, res) => {
    let date = new Date();
    orderModel.find({}, (err, array) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(array);
                res.render("ordersrecieved", { arr:array,today:date});
        }
    })
});
app.listen(process.env.PORT || 3000, () => {
    console.log("51");
    console.log("The server is running at port 3000");
});