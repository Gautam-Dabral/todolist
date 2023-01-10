require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 3000 ;


// by default looks for ejs files inside views folder 
app.set("view engine", "ejs");
// all static resources are served through public folder  
app.use(express.static(__dirname + "/public/"));
// using body-parser.urlencoded to recieve html form data
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URL, (err) => {
    if (!err) {
        console.log("successfully connected to DB.");
    } else {
        console.log(err);
    }
});


// item collection
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

const Item = new mongoose.model("Item", itemSchema);

const defaultItem1 = new Item({
    name: "Eat Sleep Code!"
})
const defaultItem2 = new Item({
    name: "Jog/ Exercise/ Walk"
})

// list collection 
const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "list title is required"]
    },
    items: {
        type: [itemSchema]
    }
})

const List = new mongoose.model("List", listSchema);
const defaultList = new List({
    name: "Today",
    items: [defaultItem1, defaultItem2]
})


// ------- to get current day and date -------  
const currentDayAndDate = () => {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
    let today = new Date().toLocaleDateString("en-US", options);
    return today;
}


// ------- routes -------  
app.get("/", (req, res) => {

    Item.find({}, (err, results) => {
        if (!err) {
            if (results.length === 0) {
                defaultItem1.save();
                defaultItem2.save();
            }
            List.find({}, (err, foundLists) => {
                if (!err) {
                    if (foundLists.length === 0) {
                        defaultList.save();
                    }
                    res.render("base", { root: path.join(__dirname, 'views'), listOfLists: foundLists, listToRender: foundLists[0] });
                } else {
                    console.log(err);
                }
            })
        } else {
            console.log(err);
        }
    })
})

app.post("/", (req, res) => {
    const newListName = req.body.newCustomList;
    const newList = new List({
        name: newListName,
        items: defaultList.items
    })
    newList.save();
    res.redirect("/")
})

app.post("/openList", (req, res) => {
    const listIdToOpen = req.body.listIdToOpen;
    var listToOpen;
    List.findOne({ _id: listIdToOpen }, (err, foundList) => {
        if (!err) {
            listToOpen = foundList
            List.find({}, (err, foundLists) => {
                if (!err) {
                    if (foundLists.length === 0) {
                        defaultList.save();
                    }
                    res.render("base", { root: path.join(__dirname, 'views'), listOfLists: foundLists, listToRender: listToOpen });
                } else {
                    console.log(err);
                }
            })
        } else { console.log(err); }
    })
})

app.post("/deleteList", (req, res) => {
    const listIdToDelete = req.body.listIdToDelete;
    List.findOneAndDelete({ _id: listIdToDelete }, (err, deletedDoc) => {
        if (!err) {
            console.log("success deleting document");
            res.redirect("/")
        } else { console.log(err); }
    })

})

app.post("/addItem", (req, res) => {
    const listId = req.body.listId;
    const itemToAdd = new Item({
        name: req.body.itemToAdd
    });

    List.findOne({ _id: listId }, (err, foundList) => {
        if (!err) {
            foundList.items.push(itemToAdd);
            foundList.save();
            List.find({}, (err, foundLists) => {
                if(!err){
                    res.render("base", { root: path.join(__dirname, 'views'), listOfLists: foundLists, listToRender: foundList})
                }else{console.log(err);}
            })
        } else { console.log(err); }
    })
})

app.post("/deleteItem", (req, res) => {

    List.findByIdAndUpdate({_id: req.body.listId},{$pull: {items: {_id: req.body.itemToDelete}}}, (err, deletedDoc) => {
        if(!err){
            List.findOne({_id: req.body.listId}, (err, foundList) => {
                if(!err){
                    List.find({}, (err, foundLists) => {
                        if(!err){
                            res.render("base", { root: path.join(__dirname, 'views'), listOfLists: foundLists, listToRender: foundList})
                        }else{console.log(err);}
                    })
                }else{console.log(err);}
            })
        }
        else{console.log(err);}
    }) 
})

module.exports = app;

app.listen(PORT, () => console.log(`Server running at port: ${PORT}`));