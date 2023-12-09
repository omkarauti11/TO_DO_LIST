const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.9t0akcl.mongodb.net/todoListDB`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
.then(() => { console.log("Connected") })
.catch((err) => { console.log(err)});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<---- Hit this to delete an item."
});


const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
    name: String, 
    items: [itemsSchema] 
});

const List = mongoose.model("List", listSchema);


app.get("/", async function (req, res) {

   
    try {
        const foundItems = await Item.find({});

        console.log(foundItems);

        if (foundItems.length === 0) {
          
            await Item.insertMany(defaultItems);
            
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItem: foundItems
            });
        }

    } catch (err) {
        console.log(err);
    }

});


app.post("/", async function (req, res) {
  
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    try {

        if (listName === "Today") {
            
            await newItem.save()
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });

            foundList.items.push(newItem);

            await foundList.save();

            res.redirect("/" + listName);
        }

    } catch (err) {
        console.log(err)
    }

});


app.post("/delete", async function (req, res) {
    

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    try {

        if (listName === "Today") {

            await Item.findByIdAndRemove(checkedItemId);
            res.redirect("/");
      

        } else {

            await List.findOneAndUpdate(
                { name: listName },  
                { $pull: { items: { _id: checkedItemId } } } 
            );

            res.redirect("/" + listName);
        }

    } catch (err) {
        console.log(err);
    }

});


app.get("/:customListName", async function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    try {
        let foundList = await List.findOne({ name: customListName });

        if (!foundList) {
           
            const list = new List({   
                name: customListName,
                items: defaultItems
            });

            foundList = await list.save(); 

        } else {
            console.log("Exists!");
          
        }

        res.render("list", {
            listTitle: foundList.name,
            newListItem: foundList.items
        });

    } catch (err) {
        console.log(err);
    }

});


app.listen(3000, function () {
    console.log("Server started on port 3000.");
});


