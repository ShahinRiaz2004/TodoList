//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const  _ = require('lodash')

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect("mongodb://localhost:27017/toListDB")
  .then(() => console.log("Connected to MongoDB"));

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete and item.",
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}).then((foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)

        .then(() => console.log("Successfully saved default items to DB"))
        .catch((err) =>
          console.error("Failed to save default items to DB", err)
        );

      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today's Todo List",
        newListItems: foundItems,
      });
    }
    // res.redirect("/");
  });
});
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((foundList) => {
    if (!foundList) {

      //Create a New list
      const list = new List({
        name: customListName,
        items: [defaultItems],
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      //Show an exitng list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
 
   if(listName === 'Today') {
    
    item.save().then(() => {;
    res.redirect("/");
    })
   }else {
    List.findOne({name: listName}).then ((foundList) => {
     foundList.items.push(item)
     return foundList.save();
    
    }).then(() => {
      res.redirect('/' + listName);
    })
   }

  
});

app.post("/delete", (req, res) => {
  const checkboxItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if(listName === "Today") {
    
  Item.deleteOne({ _id: checkboxItemId })
  .then(() => {
    console.log("Successfully removed the item.");
    res.redirect("/");
  })
  .catch((err) => { 
    console.log("Error in removing the item.");
    res.redirect("/");
  })
} else {
  List.findByIdAndUpdate({name: listName}, {$pull: {items: {_id:checkboxItemId}}},  function (err, foundList) {
    if(!err) {
      res.redirect('/', listName)
    }
  })
}

})

  


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port  3000");
});
