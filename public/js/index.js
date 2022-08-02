function addToCart(pdtname, pdtprice) {
    let cartarr = localStorage.getItem("cart");
    if (cartarr === null) {
        let arr = [];
        let obj1 = {
            productName: pdtname,
            productPrice: pdtprice,
            productQuantity: 1
        };
        arr.push(obj1);
        localStorage.setItem("cart", JSON.stringify(arr));
    }
    else {
        let arr = JSON.parse(cartarr);
        let flag = false;
        arr.forEach((item) => {
            if (item.productName === pdtname) {
                flag = true;
            }
        });
        if (flag) {
            arr.forEach((item) => {
                if (item.productName === pdtname) {
                    item.productQuantity += 1;
                }
            });
            localStorage.setItem("cart", JSON.stringify(arr));
        }
        else {
            let obj = {
                productName: pdtname,
                productPrice: pdtprice,
                productQuantity: 1
            };
            arr.push(obj);
            localStorage.setItem("cart", JSON.stringify(arr));
        }
    }
    showCart();
}


function removeFromCart(pdtname, pdtprice) {
    let cartarr = localStorage.getItem("cart");
    if (cartarr !== null) {
        let arr = JSON.parse(cartarr);
        let found = false;
        arr.forEach((ele) => {
            if (ele.productName === pdtname) {
                found = true;
            }
        });
        if (found) {
            let i;
            let flag = false;
            for (i = 0; i < arr.length; i++) {
                if (arr[i].productName === pdtname) {
                    arr[i].productQuantity -= 1;
                    if (arr[i].productQuantity === 0) {
                        flag = true;
                        break;
                    }
                }
            }
            if (flag) {
                for (i; i < arr.length - 1; i++) {
                    arr[i] = arr[i + 1];
                }
                arr.pop();
            }
            localStorage.setItem("cart", JSON.stringify(arr));
        }
    }
    showCart();
}

let modalBody = document.getElementById("modal-body1");
let itembtn = document.getElementById("itembtn");
let inputofcheckoutform = document.getElementById("inputofcheckoutform");
inputofcheckoutform.style.display = "none";
function showCart() {
    let totalamount = 0;
    let cartnumber = document.getElementById("noofitems");
    let arr = localStorage.getItem("cart");
    const attribute = document.createAttribute('value');
    attribute.value = arr;
    inputofcheckoutform.setAttributeNode(attribute);
    let pdts = JSON.parse(arr);
    let noOfItems = 0;
    for (let i = 0; i < pdts.length; i++) {
        noOfItems += pdts[i].productQuantity;
    }
    if (noOfItems === 0) {
        cartnumber.innerHTML = `<strong>(${noOfItems})</strong>`;
        modalBody.innerHTML = `<h2>No selected item</h2>`
    }
    else {
        cartnumber.innerHTML = `<strong>(${noOfItems})</strong>`;
        let table = `<table>
        <thead>
                <th>Item-Name</th>
                <th>Item-price</th>
                <th>Item-quantity</th>
                <th>Total-Price</th>
            </thead>
          `;
        for (let i = 0; i < pdts.length; i++) {
            totalamount += pdts[i].productPrice * pdts[i].productQuantity;
            table += `<tr><td>${pdts[i].productName}</td>
              <td>${pdts[i].productPrice}</td>
              <td>${pdts[i].productQuantity}</td>
              <td>${pdts[i].productQuantity * pdts[i].productPrice}</td></tr>`
        }
        table += `<tr><td colspan = '4' class = "text-right font-weight-bold">Total Price :${totalamount}</td></tr>`
        table += `</table>`;
        modalBody.innerHTML = table;
    }
}
showCart();
