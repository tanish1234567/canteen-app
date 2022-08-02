const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { response } = require("express");
mongoose.connect("mongodb+srv://tanish:tanish12345@cluster0.kyali.mongodb.net/userdb", { useNewUrlParser: true });
app.use(express.static("public"));
app.set('view engine', 'ejs');
const instance = new Razorpay({
    key_id:'rzp_test_skJk7a3iATLHzp',
    key_secret:'1f30Eu4E1sW9eY1fphVzUtQA'
});
// // let Publishable_Key = process.env.Publishable_Key;
// // let Secret_Key = process.env.Secret_Key;
// var Publishable_Key = 'pk_test_51LQujwSC4kCw36JJcP3Mjsh1LU5nA7yRdqJXWuoCoj12S25UJtqytfR4kRzPVoLDxsDEfQpMlZfh5IkkppJHfMCx00AV080qXd';
// var Secret_Key = 'sk_test_51LQujwSC4kCw36JJtxfQ3ZBjUs6lDLoRs8PLCLealxv0ffCpARp9H1ugVcA5P3IPSWNNKdcW86rLO1LavtEWnjaz00G3vCk7pG';

// const stripe = require('stripe')(Secret_Key);
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.json({
    type: ['application/json', 'text/plain']
  }));

const itemSchema = new mongoose.Schema({
    name: String,
    img: String,
    price: Number
});
const itemModel = module.exports = new mongoose.model("item", itemSchema);


const orderSchema = new mongoose.Schema({
    data: String,
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

    for (let i = 0; i < inputofcheckoutformarr.length; i++) {
        total += inputofcheckoutformarr[i].productPrice * inputofcheckoutformarr[i].productQuantity;
    }
    res.render("paybill", { items: inputofcheckoutformarr, totalamount: total ,order:inputofcheckoutformstring});
});


app.post("/payamount", (req, res) => {
    let totalPrice = parseInt(req.body.totalprice)*100;
    let orderrecieved = req.body.order;
    let options = {
        amount:totalPrice,
        currency:"INR"
    };
    instance.orders.create(options,function(err,order){
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("razorpaycheckout",{order_id:order.id,amount:totalPrice,ordersummary:orderrecieved});
        }
    })
});


app.post('/payment', function(req, res){

    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: req.body.name,
        phone:req.body.phone,
        order:req.body.order
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
            name:req.body.name,
            email: req.body.stripeEmail,
            price: req.body.amount,
            order: JSON.stringify(req.body.order)
        })
        object2.save();
        res.render("success",{items:order});// If no error occurs
    })
    .catch((err) => {
        res.render("error");// If some error occurs
    });
});

app.get("/success",(req,res)=>{
    res.render("success");
})

app.post("/success",(req,res)=>{
    // let data = req.body;
    // let obj = data;
    // let amount = obj.amount;
    // let order_id = obj.order_id;
    // let arr = obj.ordersummary;
    // console.log(amount);
    // console.log(order_id);
    // // let a = JSON.parse(arr);
    // console.log(arr[0].productQuantity);
    // console.log(arr[0].productName);
    // console.log(arr[0].productPrice);
    // // response.json({
    // //     status:"missionaccomplished",
    // // });
    console.log(req.body);
    let data = JSON.stringify(req.body);
    let ob = new orderModel({
        data:data
    });
    ob.save();
    res.end();
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
            res.render("deleteitem",{ msg: "item deleted successfully" });
        }
    })
});


app.get("/ordersrecieved", (req, res) => {
    let date = new Date();
    console.log(date);
    orderModel.find({}, (err, array) => {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(array[0].data);

                res.render("ordersrecieved", { arr:array,today:date});
        }
    })
});


app.listen(process.env.PORT || 3000, () => {
    console.log("The server is running at port 3000");
});