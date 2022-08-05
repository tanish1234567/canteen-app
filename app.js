const express = require("express");
const app = express();
let orderarr;
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { response } = require("express");
mongoose.connect("mongodb+srv://tanish:tanish12345@cluster0.kyali.mongodb.net/userdb", { useNewUrlParser: true });
// mongoose.connect("mongodb://localhost:27017/userdb", { useNewUrlParser: true });
app.use(express.static("public"));
app.set('view engine', 'ejs');
const instance = new Razorpay({
    key_id: 'rzp_test_skJk7a3iATLHzp',
    key_secret: '1f30Eu4E1sW9eY1fphVzUtQA'
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const itemSchema = new mongoose.Schema({
    name: String,
    img: String,
    price: Number
});
const itemModel = module.exports = new mongoose.model("item", itemSchema);


const orderSchema = new mongoose.Schema({
    day: String,
    date: String,
    data: String
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
    res.render("login/homelogin", { message: null });
});


app.get("/login", (req, res) => {
    res.render("login/login");
});


app.post("/login", (req, res) => {
    let email = req.body.username;
    let password = req.body.password;
    if (userModel.findOne({ email: req.body.username }, function (err, detailsofuser) {

        if (err) {

            console.log(err);
        }
        else {

            bcrypt.compare(password, detailsofuser.password, function (err, result) {

                if (err) {
                    console.log(err);
                }
                else {
                    if (result === true) {
                        if (email === "admin@admin") {
                            res.render("merchant", { msg: null });
                        }
                        else {
                            itemModel.find({}, (err, array) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.render("canteen", { items: array, name: detailsofuser.name });
                                }
                            });
                        }
                    }
                    else {
                        res.render("login/homelogin", { message: "The entered username or password is incorrect. Please try again" });
                    }
                }
            });
        }
    }));
});


app.get("/register", (req, res) => {
    res.render("login/register");
});


app.post("/register", (req, res) => {
    let name = req.body.personname;
    let email = req.body.username;
    let password = req.body.password;
    if (userModel.findOne({ email: email }, (err, enteredemail) => {
        if (err) {
            console.log(err);
        }
        else {
            if (enteredemail) {
                res.render("login/homelogin", { message: "You are already registered.Try logging in" });
            }
            else {
                bcrypt.hash(password, saltRounds, function (err, hash) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        let user1 = new userModel({
                            name: name,
                            email: email,
                            password: hash
                        });
                        user1.save();
                        itemModel.find({}, (err, array) => {
                            if (err) {
                                console.log(err);
                            } else {
                                res.render("canteen", { items: array, name: name });
                            }
                        });
                    }
                });
            }
        }
    }));
});


app.get("/cart", (req, res) => {
    res.render("cart");
});


app.post("/checkout", (req, res) => {
    let inputofcheckoutformstring = req.body.inputofcheckoutform;
    let total = 0;
    inputofcheckoutformarr = JSON.parse(inputofcheckoutformstring);
    orderarr = inputofcheckoutformarr;

    for (let i = 0; i < inputofcheckoutformarr.length; i++) {
        total += inputofcheckoutformarr[i].productPrice * inputofcheckoutformarr[i].productQuantity;
    }
    res.render("paybill", { items: inputofcheckoutformarr, totalamount: total, order: inputofcheckoutformstring });
});


app.post("/payamount", (req, res) => {
    let totalPrice = parseInt(req.body.totalprice) * 100;
    let options = {
        amount: totalPrice,
        currency: "INR"
    };
    instance.orders.create(options, function (err, order) {
        if (err) {
            console.log(err);
        }
        else {
            res.render("razorpaycheckout", { order_id: order.id, amount: totalPrice, arr: orderarr });
        }
    })
});


app.post('/payment', function (req, res) {

    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: req.body.name,
        phone: req.body.phone,
        order: req.body.order
    })
        .then((customer) => {

            return stripe.charges.create({
                amount: req.body.amount,
                description: 'Canteen food',
                currency: 'INR',
                customer: customer.id
            });
        })
        .then((charge) => {
            let object2 = new orderModel({
                name: req.body.name,
                email: req.body.stripeEmail,
                price: req.body.amount,
                order: JSON.stringify(req.body.order)
            })
            object2.save();
            res.render("success", { items: order });// If no error occurs
        })
        .catch((err) => {
            res.render("error");// If some error occurs
        });
});

app.get("/success", (req, res) => {
    let date = new Date();
    let day = date.getDay();
    let object = new orderModel({
        day: day,
        date: date,
        data: JSON.stringify(orderarr)
    });
    console.log("success called");
    object.save();
    res.render("success", { arr: orderarr });
})

app.post("/success", (req, res) => {

});

app.get("/merchant", (req, res) => {
    res.render("merchant", { msg: null });
});


app.post("/merchant", (req, res) => {
    let itemname = req.body.nameofitem;
    let price = req.body.priceofitem;
    let imgUrl = req.body.imgUrl;
    let item1 = new itemModel({
        name: itemname,
        img: imgUrl,
        price: price
    });
    item1.save();
    res.render("merchant", { msg: "item added successfully" });
});


app.get("/deleteitem", (req, res) => {
    res.render("deleteitem", { msg: null });
});


app.post("/deleteitem", (req, res) => {
    let itemtobedeleted = req.body.nameofitem;
    console.log(itemtobedeleted);
    itemModel.findOneAndDelete({ name: itemtobedeleted }, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render("deleteitem", { msg: "item deleted successfully" });
        }
    })
});

app.get("/clearorders",(req,res)=>{
    mongoose.connection.db.dropCollection('orders', function(err, result) {
        if(err)
        {
            console.log(err);
        }
        else{
            console.log("done");
        }
    });
    res.render("ordersrecieved",{array:null});
});

app.get("/ordersrecieved", (req, res) => {
    let today = new Date().getDate();
    orderModel.find({}, (err, array) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(array);
        }
    });    
    orderModel.find({}, (err, array) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render("ordersrecieved", { array: array });
        }
    });
});


app.listen(process.env.PORT || 3000, () => {
    console.log("The server is running at port 3000");
});