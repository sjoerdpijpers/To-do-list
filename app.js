const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set('strictQuery', false);
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', {useNewUrlParser: true});
mongoose.connect('mongodb+srv://admin-sjoerd:Test123@cluster0.kjrfogs.mongodb.net/todolistDB?retryWrites=true&w=majority', {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({name: "Welcome to your todolist!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item"});

const defaultItems = [item1, item2, item3];


app.get('/', (req, res) => {
    
    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Succesfully added default items to database");
                }
            });
            res.redirect("/");
        }else {
            res.render('list', {listTitle: "Today", newListItems: foundItems}); // date.getDate()
        }
    })

})

app.get("/:customListName", (req,res)=>{
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name: customListName}, function(err,foundList){
        if(!err){
            if(!foundList){
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show an existing list
                res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
            }
        }
    })


})

app.post("/", (req,res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({name: itemName});

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}, function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

app.post("/delete", (req,res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Succesfully deleted checked item from the items-database");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }

})

app.get('/about', (req, res) => {
    res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
console.log("Server has started succesfully.");
})
